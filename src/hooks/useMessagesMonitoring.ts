
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface MonitoringMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  school_id: string;
  subject: string;
  body: string;
  is_read: boolean;
  parent_message_id: string | null;
  created_at: string;
  sender_name: string;
  sender_role: string;
  receiver_name: string;
  receiver_role: string;
}

export interface MonitoringConversation {
  conversation_id: string;
  student_id: string;
  student_name: string;
  teacher_id: string;
  teacher_name: string;
  last_message: string;
  last_message_time: string;
  status: 'active' | 'blocked';
  messages: MonitoringMessage[];
}

export interface ConversationStats {
  totalConversations: number;
  totalMessages: number;
  activeConversations: number;
  blockedConversations: number;
}

export const useMessagesMonitoring = () => {
  const { user } = useAuth();

  // State declarations – use proper TypeScript generic syntax
  const [conversations, setConversations] = useState<MonitoringConversation[]>([]);
  const [stats, setStats] = useState<ConversationStats>({
    totalConversations: 0,
    totalMessages: 0,
    activeConversations: 0,
    blockedConversations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Fetch all conversations in the school
  // -------------------------------------------------------------------------
  const fetchConversations = useCallback(async () => {
    if (!user?.school_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // -------------------------------------------------
      // 1️⃣ Fetch messages together with sender/receiver profiles
      // -------------------------------------------------
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          recipient_id,
          school_id,
          subject,
          body,
          is_read,
          parent_message_id,
          created_at,
          sender:profiles!messages_sender_id_fkey(id, full_name, role),
          receiver:profiles!messages_recipient_id_fkey(id, full_name, role)
        `)
        .eq('school_id', user.school_id)
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      // -------------------------------------------------
      // 2️⃣ Group messages by student‑teacher pair
      // -------------------------------------------------
      const conversationMap = new Map<string, MonitoringMessage[]>();

      messages?.forEach((msg: any) => {
        const senderRole = msg.sender?.role ?? '';
        const receiverRole = msg.receiver?.role ?? '';

        let studentId = '';
        let teacherId = '';
        let studentName = '';
        let teacherName = '';

        if (senderRole === 'student' && receiverRole === 'teacher') {
          studentId = msg.sender_id;
          teacherId = msg.recipient_id;
          studentName = msg.sender?.full_name ?? 'Unknown Student';
          teacherName = msg.receiver?.full_name ?? 'Unknown Teacher';
        } else if (senderRole === 'teacher' && receiverRole === 'student') {
          studentId = msg.recipient_id;
          teacherId = msg.sender_id;
          studentName = msg.receiver?.full_name ?? 'Unknown Student';
          teacherName = msg.sender?.full_name ?? 'Unknown Teacher';
        } else {
          // Not a student‑teacher conversation – ignore
          return;
        }

        // Create a stable key (student‑teacher pair sorted alphabetically)
        const conversationKey = [studentId, teacherId].sort().join('-');

        if (!conversationMap.has(conversationKey)) {
          conversationMap.set(conversationKey, []);
        }

        conversationMap.get(conversationKey)!.push({
          id: msg.id,
          sender_id: msg.sender_id,
          recipient_id: msg.recipient_id,
          school_id: msg.school_id,
          subject: msg.subject ?? '',
          body: msg.body,
          is_read: msg.is_read,
          parent_message_id: msg.parent_message_id,
          created_at: msg.created_at,
          sender_name: msg.sender?.full_name ?? 'Unknown',
          sender_role: senderRole,
          receiver_name: msg.receiver?.full_name ?? 'Unknown',
          receiver_role: receiverRole,
        });
      });

      // -------------------------------------------------
      // 3️⃣ Build conversation objects
      // -------------------------------------------------
      const conversationsList: MonitoringConversation[] = Array.from(
        conversationMap.entries()
      ).map(([key, msgs]) => {
        // newest first
        const sortedMsgs = msgs.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const lastMsg = sortedMsgs[0];

        // Determine which side is student / teacher from the last message
        const isStudentSender = lastMsg.sender_role === 'student';
        const studentId = isStudentSender ? lastMsg.sender_id : lastMsg.recipient_id;
        const teacherId = isStudentSender ? lastMsg.recipient_id : lastMsg.sender_id;
        const studentName = isStudentSender ? lastMsg.sender_name : lastMsg.receiver_name;
        const teacherName = isStudentSender ? lastMsg.receiver_name : lastMsg.sender_name;

        // Detect a blocked conversation (any unread message containing the marker)
        const isBlocked = msgs.some(
          (m) => !m.is_read && m.body.includes('[BLOCKED]')
        );

        return {
          conversation_id: key,
          student_id: studentId,
          student_name: studentName,
          teacher_id: teacherId,
          teacher_name: teacherName,
          last_message: lastMsg.body,
          last_message_time: lastMsg.created_at,
          status: isBlocked ? 'blocked' : 'active',
          // reverse to oldest‑first for UI thread rendering
          messages: sortedMsgs.reverse(),
        };
      });

      // -------------------------------------------------
      // 4️⃣ Sort conversations by most recent activity
      // -------------------------------------------------
      conversationsList.sort(
        (a, b) =>
          new Date(b.last_message_time).getTime() -
          new Date(a.last_message_time).getTime()
      );

      setConversations(conversationsList);

      // -------------------------------------------------
      // 5️⃣ Compute stats
      // -------------------------------------------------
      const totalMessages = conversationsList.reduce(
        (sum, conv) => sum + conv.messages.length,
        0
      );
      const blockedCount = conversationsList.filter(
        (conv) => conv.status === 'blocked'
      ).length;

      setStats({
        totalConversations: conversationsList.length,
        totalMessages,
        activeConversations: conversationsList.length - blockedCount,
        blockedConversations: blockedCount,
      });
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [user?.school_id]);

  // -------------------------------------------------------------------------
  // Block a conversation – adds "[BLOCKED]" marker to each message body
  // -------------------------------------------------------------------------
  const blockConversation = useCallback(
    async (conversationId: string): Promise<boolean> => {
      if (!user?.school_id) return false;

      try {
        const conversation = conversations.find((c) => c.conversation_id === conversationId);
        if (!conversation) return false;

        const messageIds = conversation.messages.map((m) => m.id);

        const { error: updateError } = await supabase
          .from('messages')
          .update({
            body: supabase.raw(
              `CASE WHEN body NOT LIKE '%[BLOCKED]%' THEN body || ' [BLOCKED]' ELSE body END`
            ),
          })
          .in('id', messageIds);

        if (updateError) throw updateError;

        await fetchConversations();
        return true;
      } catch (err) {
        console.error('Error blocking conversation:', err);
        setError(err instanceof Error ? err.message : 'Failed to block conversation');
        return false;
      }
    },
    [user?.school_id, conversations, fetchConversations]
  );

  // -------------------------------------------------------------------------
  // Unblock a conversation – removes the marker
  // -------------------------------------------------------------------------
  const unblockConversation = useCallback(
    async (conversationId: string): Promise<boolean> => {
      if (!user?.school_id) return false;

      try {
        const conversation = conversations.find((c) => c.conversation_id === conversationId);
        if (!conversation) return false;

        const messageIds = conversation.messages.map((m) => m.id);

        const { error: updateError } = await supabase
          .from('messages')
          .update({
            body: supabase.raw(`REPLACE(body, ' [BLOCKED]', '')`),
          })
          .in('id', messageIds);

        if (updateError) throw updateError;

        await fetchConversations();
        return true;
      } catch (err) {
        console.error('Error unblocking conversation:', err);
        setError(err instanceof Error ? err.message : 'Failed to unblock conversation');
        return false;
      }
    },
    [user?.school_id, conversations, fetchConversations]
  );

  // -------------------------------------------------------------------------
  // Delete a message – soft delete by overwriting body
  // -------------------------------------------------------------------------
  const deleteMessage = useCallback(
    async (messageId: string): Promise<boolean> => {
      if (!user?.school_id) return false;

      try {
        const { error: updateError } = await supabase
          .from('messages')
          .update({
            body: '[Message deleted by administrator]',
            is_read: true,
          })
          .eq('id', messageId);

        if (updateError) throw updateError;

        await fetchConversations();
        return true;
      } catch (err) {
        console.error('Error deleting message:', err);
        setError(err instanceof Error ? err.message : 'Failed to delete message');
        return false;
      }
    },
    [user?.school_id, fetchConversations]
  );

  // -------------------------------------------------------------------------
  // Real‑time subscription – refresh when any message in the school changes
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!user?.school_id) return;

    const channel = supabase
      .channel('messages-monitoring')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `school_id=eq.${user.school_id}`,
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.school_id, fetchConversations]);

  // -------------------------------------------------------------------------
  // Initial fetch
  // -------------------------------------------------------------------------
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    stats,
    loading,
    error,
    blockConversation,
    unblockConversation,
    deleteMessage,
    refetch: fetchConversations,
  };
};
