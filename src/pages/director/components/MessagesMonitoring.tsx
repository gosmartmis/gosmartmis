import { useState } from 'react';
import { useMessagesMonitoring } from '../../../hooks/useMessagesMonitoring';
import type { MonitoringConversation, MonitoringMessage } from '../../../hooks/useMessagesMonitoring';

export default function MessagesMonitoring() {
  const { conversations, stats, loading, error, blockConversation, unblockConversation, deleteMessage } = useMessagesMonitoring();
  const [selectedConversation, setSelectedConversation] = useState<MonitoringConversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'blocked'>('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<MonitoringMessage | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = 
      conv.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.teacher_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.last_message.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || conv.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const handleDeleteMessage = async () => {
    if (!messageToDelete) return;
    
    setActionLoading(true);
    const success = await deleteMessage(messageToDelete.id);
    setActionLoading(false);
    
    if (success) {
      setShowDeleteModal(false);
      setMessageToDelete(null);
      // Update selected conversation
      if (selectedConversation) {
        const updated = conversations.find(c => c.conversation_id === selectedConversation.conversation_id);
        if (updated) setSelectedConversation(updated);
      }
    }
  };

  const handleBlockConversation = async () => {
    if (!selectedConversation) return;
    
    setActionLoading(true);
    const success = await blockConversation(selectedConversation.conversation_id);
    setActionLoading(false);
    
    if (success) {
      setShowBlockModal(false);
      // Update selected conversation
      const updated = conversations.find(c => c.conversation_id === selectedConversation.conversation_id);
      if (updated) setSelectedConversation(updated);
    }
  };

  const handleUnblockConversation = async () => {
    if (!selectedConversation) return;
    
    setActionLoading(true);
    const success = await unblockConversation(selectedConversation.conversation_id);
    setActionLoading(false);
    
    if (success) {
      // Update selected conversation
      const updated = conversations.find(c => c.conversation_id === selectedConversation.conversation_id);
      if (updated) setSelectedConversation(updated);
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
      <div className="p-6 flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <i className="ri-error-warning-line text-red-600 text-2xl"></i>
            <div>
              <h3 className="font-semibold text-red-900">Error Loading Conversations</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Messages Monitoring</h1>
        <p className="text-sm text-gray-600 mt-1">
          Monitor all student-teacher communications
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <i className="ri-message-3-line text-blue-600 text-xl"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Conversations</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalConversations}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <i className="ri-chat-check-line text-green-600 text-xl"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Messages</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMessages}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-teal-100 flex items-center justify-center">
              <i className="ri-checkbox-circle-line text-teal-600 text-xl"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Conversations</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeConversations}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
              <i className="ri-forbid-line text-red-600 text-xl"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Blocked Conversations</p>
              <p className="text-2xl font-bold text-gray-900">{stats.blockedConversations}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-420px)]">
        {/* Conversations List */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 space-y-3">
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

            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  filterStatus === 'all'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  filterStatus === 'active'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilterStatus('blocked')}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  filterStatus === 'blocked'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Blocked
              </button>
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
                  key={conv.conversation_id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left ${
                    selectedConversation?.conversation_id === conv.conversation_id ? 'bg-teal-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <i className="ri-group-line text-purple-600 text-lg"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {conv.student_name} ↔ {conv.teacher_name}
                        </h3>
                        {conv.status === 'blocked' && (
                          <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 whitespace-nowrap">
                            Blocked
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-1">{conv.last_message}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{formatTime(conv.last_message_time)}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{conv.messages.length} messages</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Message Thread with Controls */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          {selectedConversation ? (
            <>
              {/* Header with Controls */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <i className="ri-group-line text-purple-600 text-lg"></i>
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-gray-900">
                        {selectedConversation.student_name} ↔ {selectedConversation.teacher_name}
                      </h2>
                      <p className="text-xs text-gray-600">
                        Student to Teacher Communication
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    selectedConversation.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedConversation.status === 'active' ? 'Active' : 'Blocked'}
                  </span>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center gap-2">
                  {selectedConversation.status === 'active' ? (
                    <button
                      onClick={() => setShowBlockModal(true)}
                      disabled={actionLoading}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors whitespace-nowrap disabled:opacity-50"
                    >
                      <i className="ri-forbid-line"></i>
                      Block Conversation
                    </button>
                  ) : (
                    <button
                      onClick={handleUnblockConversation}
                      disabled={actionLoading}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors whitespace-nowrap disabled:opacity-50"
                    >
                      <i className="ri-checkbox-circle-line"></i>
                      {actionLoading ? 'Unblocking...' : 'Unblock Conversation'}
                    </button>
                  )}
                  <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap">
                    <i className="ri-download-line"></i>
                    Export
                  </button>
                </div>
              </div>

              {/* Messages with Delete Option */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedConversation.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="group"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        msg.sender_role === 'student' ? 'bg-blue-100' : 'bg-teal-100'
                      }`}>
                        <i className={`${
                          msg.sender_role === 'student' ? 'ri-user-line text-blue-600' : 'ri-user-star-line text-teal-600'
                        } text-sm`}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-gray-900">{msg.sender_name}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            msg.sender_role === 'student'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-teal-100 text-teal-800'
                          }`}>
                            {msg.sender_role === 'student' ? 'Student' : 'Teacher'}
                          </span>
                          <span className="text-xs text-gray-500">{formatTime(msg.created_at)}</span>
                        </div>
                        {msg.subject && (
                          <p className="text-xs font-medium text-gray-700 mb-1">{msg.subject}</p>
                        )}
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <p className="text-sm text-gray-900">{msg.body}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setMessageToDelete(msg);
                          setShowDeleteModal(true);
                        }}
                        disabled={msg.body === '[Message deleted by administrator]'}
                        className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg transition-all whitespace-nowrap disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Delete message"
                      >
                        <i className="ri-delete-bin-line text-lg"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Info Footer */}
              <div className="p-4 border-t border-gray-200 bg-amber-50">
                <div className="flex items-start gap-2">
                  <i className="ri-information-line text-amber-600 text-lg mt-0.5"></i>
                  <div>
                    <p className="text-xs font-medium text-amber-900">Director Monitoring Mode</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      You are viewing this conversation in read-only mode. You can delete inappropriate messages or block the entire conversation.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-6">
              <i className="ri-eye-line text-6xl mb-4"></i>
              <h3 className="text-lg font-semibold mb-2">Select a conversation to monitor</h3>
              <p className="text-sm text-center">Choose a conversation from the list to view all messages</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Message Modal */}
      {showDeleteModal && messageToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <i className="ri-delete-bin-line text-red-600 text-2xl"></i>
              </div>
              <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Delete Message?</h2>
              <p className="text-sm text-gray-600 text-center mb-4">
                Are you sure you want to delete this message? This action cannot be undone.
              </p>
              <div className="bg-gray-50 rounded-lg p-3 mb-6">
                <p className="text-xs font-medium text-gray-700 mb-1">
                  From: {messageToDelete.sender_name}
                </p>
                <p className="text-xs text-gray-600 line-clamp-3">{messageToDelete.body}</p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setMessageToDelete(null);
                }}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMessage}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap disabled:opacity-50"
              >
                {actionLoading ? 'Deleting...' : 'Delete Message'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Conversation Modal */}
      {showBlockModal && selectedConversation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <i className="ri-forbid-line text-red-600 text-2xl"></i>
              </div>
              <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Block Conversation?</h2>
              <p className="text-sm text-gray-600 text-center mb-4">
                Are you sure you want to block this conversation? Both the student and teacher will no longer be able to send messages to each other.
              </p>
              <div className="bg-gray-50 rounded-lg p-3 mb-6">
                <p className="text-xs font-medium text-gray-700">
                  {selectedConversation.student_name} ↔ {selectedConversation.teacher_name}
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowBlockModal(false)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBlockConversation}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap disabled:opacity-50"
              >
                {actionLoading ? 'Blocking...' : 'Block Conversation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}