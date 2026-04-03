import { useState, useEffect } from 'react';
import { useMessages } from '../../../hooks/useMessages';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../lib/supabase';

interface StaffMember {
  id: string;
  full_name: string;
  role: string;
  avatar_url?: string;
}

export default function Messages() {
  const { profile } = useAuth();
  const { conversations, loading, error, sending, sendMessage, markAsRead, fetchThread } = useMessages();
  const [selectedConversation, setSelectedConversation] = useState<typeof conversations[0] | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [newMessageRecipient, setNewMessageRecipient] = useState('');
  const [newMessageSubject, setNewMessageSubject] = useState('');
  const [newMessageText, setNewMessageText] = useState('');
  const [threadMessages, setThreadMessages] = useState<any[]>([]);

  // Fetch staff members for new message modal
  useEffect(() => {
    if (!profile?.school_id) return;

    const fetchStaff = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, role, avatar_url')
        .eq('school_id', profile.school_id)
        .in('role', ['teacher', 'registrar', 'accountant', 'director', 'school_manager'])
        .neq('id', profile.id)
        .order('full_name');

      if (data) setStaffMembers(data);
    };

    fetchStaff();
  }, [profile?.school_id, profile?.id]);

  // Load thread when conversation is selected
  useEffect(() => {
    if (!selectedConversation) return;

    const loadThread = async () => {
      const messages = await fetchThread(selectedConversation.otherUserId);
      setThreadMessages(messages);
      
      // Mark as read
      if (selectedConversation.unreadCount > 0) {
        await markAsRead(selectedConversation.otherUserId);
      }
    };

    loadThread();
  }, [selectedConversation, fetchThread, markAsRead]);

  const filteredConversations = conversations.filter(c => 
    c.otherUserName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.otherUserRole.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendReply = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;

    const success = await sendMessage(
      selectedConversation.otherUserId,
      'Re: ' + (threadMessages[0]?.subject || 'Conversation'),
      newMessage.trim(),
      threadMessages[0]?.id || null
    );

    if (success) {
      setNewMessage('');
      // Reload thread
      const messages = await fetchThread(selectedConversation.otherUserId);
      setThreadMessages(messages);
    }
  };

  const handleSendNewMessage = async () => {
    if (!newMessageRecipient || !newMessageSubject.trim() || !newMessageText.trim() || sending) return;

    const success = await sendMessage(
      newMessageRecipient,
      newMessageSubject.trim(),
      newMessageText.trim()
    );

    if (success) {
      setShowNewMessageModal(false);
      setNewMessageRecipient('');
      setNewMessageSubject('');
      setNewMessageText('');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatMessageTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Messages</h2>
          <p className="text-gray-600 mt-1">Communicate with teachers, parents, and staff</p>
        </div>
        <button 
          onClick={() => setShowNewMessageModal(true)}
          className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
        >
          <i className="ri-add-line mr-2"></i>
          New Message
        </button>
      </div>

      {loading && conversations.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500 mt-3">Loading conversations...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <i className="ri-error-warning-line text-4xl text-red-400 mb-3 w-10 h-10 flex items-center justify-center mx-auto"></i>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-[600px]">
          <div className="grid grid-cols-3 h-full">
            {/* Conversations List */}
            <div className="border-r border-gray-100 flex flex-col">
              <div className="p-4 border-b border-gray-100">
                <div className="relative">
                  <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 flex items-center justify-center"></i>
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <i className="ri-message-3-line text-4xl text-gray-300 mb-3 w-10 h-10 flex items-center justify-center mx-auto"></i>
                    <p className="text-sm text-gray-500">No conversations yet</p>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <button
                      key={conversation.otherUserId}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 ${
                        selectedConversation?.otherUserId === conversation.otherUserId ? 'bg-teal-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {getInitials(conversation.otherUserName)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-900 truncate">{conversation.otherUserName}</span>
                            <span className="text-xs text-gray-500">{formatTime(conversation.lastMessageTime)}</span>
                          </div>
                          <p className="text-xs text-gray-500 capitalize">{conversation.otherUserRole}</p>
                          <p className="text-sm text-gray-600 truncate mt-1">{conversation.lastMessage}</p>
                        </div>
                        {conversation.unreadCount > 0 && (
                          <span className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="col-span-2 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {getInitials(selectedConversation.otherUserName)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{selectedConversation.otherUserName}</h3>
                        <p className="text-xs text-gray-500 capitalize">{selectedConversation.otherUserRole}</p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {selectedConversation.status === 'blocked' && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                        <i className="ri-error-warning-line text-amber-600 mr-2"></i>
                        <span className="text-sm text-amber-700">This conversation has been blocked by administration</span>
                      </div>
                    )}
                    {threadMessages.map((msg) => {
                      const isMe = msg.sender_id === profile?.id;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] ${isMe ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-900'} rounded-2xl px-4 py-2`}>
                            <p className="text-sm">{msg.message_text}</p>
                            <span className={`text-xs ${isMe ? 'text-white/80' : 'text-gray-500'} block mt-1`}>
                              {formatMessageTime(msg.created_at)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Input Area */}
                  <div className="p-4 border-t border-gray-100">
                    {selectedConversation.status === 'blocked' ? (
                      <div className="text-center text-sm text-gray-500 py-2">
                        Cannot send messages in a blocked conversation
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <input
                            type="text"
                            placeholder="Type a message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendReply();
                              }
                            }}
                            disabled={sending}
                            maxLength={500}
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm disabled:bg-gray-50"
                          />
                          <button 
                            onClick={handleSendReply}
                            disabled={!newMessage.trim() || sending}
                            className="p-2 bg-teal-500 hover:bg-teal-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <i className="ri-send-plane-fill w-5 h-5 flex items-center justify-center"></i>
                          </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 text-right">{newMessage.length}/500 • Press Enter to send</p>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="ri-message-3-line text-3xl text-gray-400 w-8 h-8 flex items-center justify-center"></i>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Select a Conversation</h3>
                    <p className="text-gray-600">Choose a conversation from the list to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Message Modal */}
      {showNewMessageModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">New Message</h3>
                <button
                  onClick={() => setShowNewMessageModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Recipient</label>
                <select
                  value={newMessageRecipient}
                  onChange={(e) => setNewMessageRecipient(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="">Select recipient...</option>
                  {staffMembers.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.full_name} ({staff.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={newMessageSubject}
                  onChange={(e) => setNewMessageSubject(e.target.value)}
                  placeholder="Enter subject..."
                  maxLength={100}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                <textarea
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  placeholder="Type your message..."
                  rows={5}
                  maxLength={500}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                ></textarea>
                <p className="text-xs text-gray-400 mt-1 text-right">{newMessageText.length}/500</p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
              <button
                onClick={() => setShowNewMessageModal(false)}
                className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                Cancel
              </button>
              <button 
                onClick={handleSendNewMessage}
                disabled={!newMessageRecipient || !newMessageSubject.trim() || !newMessageText.trim() || sending}
                className="px-6 py-2.5 rounded-xl bg-teal-500 text-white font-semibold hover:bg-teal-600 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}