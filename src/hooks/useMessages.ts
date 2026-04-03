import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  school_id: string;
  subject: string;
  message_text: string;
  status: 'sent' | 'read' | 'blocked' | 'deleted';
  parent_message_id: string | null;
  created_at: string;
  updated_at: string;
  sender?: {
    id: string;
    full_name: string;
    role: string;
    avatar_url?: string;
  };
  receiver?: {
    id: string;
    full_name: string;
    role: string;
    avatar_url?: string;
  };
}

export interface Conversation {
  otherUserId: string;
  otherUserName: string;
  otherUserRole: string;
  otherUserAvatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  status: 'sent' | 'read' | 'blocked' | 'deleted';
  messages: Message[];
}

export const useMessages = () => {
  const { profile: user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // Fetch all conversations for the current user
  const fetchConversations = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch all messages where user is sender or receiver
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, full_name, role, avatar_url),
          receiver:profiles!messages_receiver_id_fkey(id, full_name, role, avatar_url)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .not('status', 'eq', 'deleted')
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      // Group messages by conversation (other user)
      const conversationMap = new Map<string, Message[]>();

      messages?.forEach((msg) => {
        const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        
        if (!conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, []);
        }
        conversationMap.get(otherUserId)?.push(msg);
      });

      // Convert to conversation objects
      const conversationsList: Conversation[] = Array.from(conversationMap.entries()).map(
        ([otherUserId, msgs]) => {
          const sortedMsgs = msgs.sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          const lastMsg = sortedMsgs[0];
          const otherUser = lastMsg.sender_id === user.id ? lastMsg.receiver : lastMsg.sender;

          // Count unread messages (received by current user with status 'sent')
          const unreadCount = msgs.filter(
            (m) => m.receiver_id === user.id && m.status === 'sent'
          ).length;

          return {
            otherUserId,
            otherUserName: otherUser?.full_name || 'Unknown User',
            otherUserRole: otherUser?.role || '',
            otherUserAvatar: otherUser?.avatar_url,
            lastMessage: lastMsg.message_text,
            lastMessageTime: lastMsg.created_at,
            unreadCount,
            status: lastMsg.status,
            messages: sortedMsgs.reverse(), // Oldest first for thread display
          };
        }
      );

      // Sort by last message time
      conversationsList.sort(
        (a, b) =>
          new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      );

      setConversations(conversationsList);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch a single conversation thread between two users
  const fetchThread = useCallback(
    async (otherUserId: string): Promise<Message[]> => {
      if (!user?.id) return [];

      try {
        const { data, error: threadError } = await supabase
          .from('messages')
          .select(`
            *,
            sender:profiles!messages_sender_id_fkey(id, full_name, role, avatar_url),
            receiver:profiles!messages_receiver_id_fkey(id, full_name, role, avatar_url)
          `)
          .or(
            `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
          )
          .not('status', 'eq', 'deleted')
          .order('created_at', { ascending: true });

        if (threadError) throw threadError;

        return data || [];
      } catch (err) {
        console.error('Error fetching thread:', err);
        return [];
      }
    },
    [user?.id]
  );

  // Send a new message
  const sendMessage = useCallback(
    async (
      receiverId: string,
      subject: string,
      messageText: string,
      parentMessageId: string | null = null
    ): Promise<boolean> => {
      if (!user?.id || !user.school_id) {
        setError('User not authenticated or school not set');
        return false;
      }

      try {
        setSending(true);
        setError(null);

        // Check if conversation is blocked
        const { data: blockedCheck } = await supabase
          .from('messages')
          .select('status')
          .or(
            `and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`
          )
          .eq('status', 'blocked')
          .limit(1)
          .maybeSingle();

        if (blockedCheck) {
          setError('This conversation has been blocked');
          return false;
        }

        const { error: insertError } = await supabase.from('messages').insert({
          sender_id: user.id,
          receiver_id: receiverId,
          school_id: user.school_id,
          subject,
          message_text: messageText,
          status: 'sent',
          parent_message_id: parentMessageId,
        });

        if (insertError) throw insertError;

        // Refresh conversations
        await fetchConversations();
        return true;
      } catch (err) {
        console.error('Error sending message:', err);
        setError(err instanceof Error ? err.message : 'Failed to send message');
        return false;
      } finally {
        setSending(false);
      }
    },
    [user?.id, user?.school_id, fetchConversations]
  );

  // Mark messages as read
  const markAsRead = useCallback(
    async (otherUserId: string): Promise<void> => {
      if (!user?.id) return;

      try {
        // Update all unread messages from the other user
        const { error: updateError } = await supabase
          .from('messages')
          .update({ status: 'read', updated_at: new Date().toISOString() })
          .eq('sender_id', otherUserId)
          .eq('receiver_id', user.id)
          .eq('status', 'sent');

        if (updateError) throw updateError;

        // Refresh conversations to update unread counts
        await fetchConversations();
      } catch (err) {
        console.error('Error marking messages as read:', err);
      }
    },
    [user?.id, fetchConversations]
  );

  // Get total unread count
  const getUnreadCount = useCallback((): number => {
    return conversations.reduce((total, conv) => total + conv.unreadCount, 0);
  }, [conversations]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          // Refresh conversations when a new message is received
          fetchConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${user.id}`,
        },
        () => {
          // Refresh when sent messages are updated (e.g., marked as read)
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchConversations]);

  // Initial fetch
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    loading,
    error,
    sending,
    sendMessage,
    markAsRead,
    fetchThread,
    getUnreadCount,
    refetch: fetchConversations,
  };
};