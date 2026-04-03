import { useState, useEffect } from 'react';
import { useMessages } from '../../../hooks/useMessages';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../lib/supabase';

interface Teacher {
  id: string;
  full_name: string;
  email: string;
}

export default function Messages() {
  const { profile } = useAuth();
  const { conversations, loading, error, sendMessage, markAsRead, fetchThread, sending } = useMessages();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [subject, setSubject] = useState('');
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  // Fetch teachers when new message modal opens
  useEffect(() => {
    if (showNewMessage && profile?.school_id) {
      setLoadingTeachers(true);
      supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('school_id', profile.school_id)
        .eq('role', 'teacher')
        .eq('is_active', true)
        .order('full_name')
        .then(({ data }) => {
          if (data) {
            setTeachers(data as Teacher[]);
          }
          setLoadingTeachers(false);
        });
    }
  }, [showNewMessage, profile?.school_id]);

  const selectedConversation = conversations.find(c => c.otherUserId === selectedConversationId);

  const filteredConversations = conversations.filter(conv =>
    conv.otherUserName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectConversation = async (conversationId: string) => {
    setSelectedConversationId(conversationId);
    const conv = conversations.find(c => c.otherUserId === conversationId);
    if (conv && conv.unreadCount > 0) {
      await markAsRead(conversationId);
    }
    await fetchThread(conversationId);
  };

  const handleSendReply = async () => {
    if (!messageText.trim() || !selectedConversationId || !profile?.id) return;
    
    const success = await sendMessage({
      receiverId: selectedConversationId,
      subject: subject || 'Re: Conversation',
      messageText: messageText.trim(),
      schoolId: profile.school_id || '',
    });
    
    if (success) {
      setMessageText('');
      setSubject('');
      await fetchThread(selectedConversationId);
    }
  };

  const handleNewMessage = async () => {
    if (!subject.trim() || !messageText.trim() || !selectedTeacherId || !profile?.id) {
      alert('Please fill in all fields');
      return;
    }
    
    const success = await sendMessage({
      receiverId: selectedTeacherId,
      subject: subject.trim(),
      messageText: messageText.trim(),
      schoolId: profile.school_id || '',
    });
    
    if (success) {
      setShowNewMessage(false);
      setSubject('');
      setMessageText('');
      setSelectedTeacherId('');
      // Auto-select the new conversation
      setSelectedConversationId(selectedTeacherId);
      await fetchThread(selectedTeacherId);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <div className="text-center">
          <i className="ri-loader-4-line text-4xl text-teal-600 animate-spin"></i>
          <p className="text-sm text-gray-600 mt-2">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <i className="ri-error-warning-line text-3xl text-red-600 mb-2"></i>
          <p className="text-sm text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-sm text-gray-600 mt-1">Communicate with your teachers</p>
        </div>
        <button
          onClick={() => setShowNewMessage(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap"
        >
          <i className="ri-add-line text-lg"></i>
          <span className="text-sm font-medium">New Message</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Conversations List */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6">
                <i className="ri-message-3-line text-5xl mb-3"></i>
                <p className="text-sm">No conversations found</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.otherUserId}
                  onClick={() => handleSelectConversation(conv.otherUserId)}
                  className={`w-full p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left ${
                    selectedConversationId === conv.otherUserId ? 'bg-teal-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                      <i className="ri-user-line text-teal-600 text-lg"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {conv.otherUserName}
                        </h3>
                        <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                          {formatTime(conv.lastMessageTime)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">{conv.lastMessage}</p>
                      {conv.unreadCount > 0 && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                            {conv.unreadCount} new
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Message Thread */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                    <i className="ri-user-line text-teal-600 text-lg"></i>
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">
                      {selectedConversation.otherUserName}
                    </h2>
                    <p className="text-xs text-gray-600">Teacher</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedConversation.thread.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderId === profile?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        msg.senderId === profile?.id
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold">{msg.senderName}</span>
                        <span className={`text-xs ${msg.senderId === profile?.id ? 'text-teal-100' : 'text-gray-500'}`}>
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                      {msg.subject && (
                        <p className={`text-xs font-medium mb-1 ${msg.senderId === profile?.id ? 'text-teal-100' : 'text-gray-600'}`}>
                          {msg.subject}
                        </p>
                      )}
                      <p className="text-sm">{msg.messageText}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Input */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type your reply..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !sending && handleSendReply()}
                    disabled={sending}
                    className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={sending || !messageText.trim()}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <i className="ri-loader-4-line text-lg animate-spin"></i>
                    ) : (
                      <i className="ri-send-plane-fill text-lg"></i>
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-6">
              <i className="ri-message-3-line text-6xl mb-4"></i>
              <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
              <p className="text-sm text-center">Choose a conversation from the list to view messages</p>
            </div>
          )}
        </div>
      </div>

      {/* New Message Modal */}
      {showNewMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">New Message</h2>
              <button
                onClick={() => {
                  setShowNewMessage(false);
                  setSubject('');
                  setMessageText('');
                  setSelectedTeacherId('');
                }}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Teacher
                </label>
                {loadingTeachers ? (
                  <div className="flex items-center justify-center py-4">
                    <i className="ri-loader-4-line text-2xl text-teal-600 animate-spin"></i>
                  </div>
                ) : (
                  <select 
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">Choose a teacher...</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.full_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="Enter message subject..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  placeholder="Type your message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows={6}
                  maxLength={500}
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                ></textarea>
                <p className="text-xs text-gray-500 mt-1">{messageText.length}/500 characters</p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowNewMessage(false);
                  setSubject('');
                  setMessageText('');
                  setSelectedTeacherId('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                onClick={handleNewMessage}
                disabled={sending || !selectedTeacherId || !subject.trim() || !messageText.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap disabled:bg-gray-300 disabled:cursor-not-allowed"
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