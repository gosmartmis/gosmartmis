import { useState } from 'react';

interface Message {
  id: string;
  sender: string;
  senderId: string;
  senderRole: 'student' | 'teacher';
  receiver: string;
  receiverId: string;
  receiverRole: 'student' | 'teacher';
  messageText: string;
  createdAt: string;
  status: 'active' | 'blocked' | 'deleted';
  schoolId: string;
}

interface Conversation {
  id: string;
  student: string;
  teacher: string;
  lastMessage: string;
  lastDate: string;
  messageCount: number;
  unreadCount: number;
  status: 'active' | 'blocked';
}

export default function Messages() {
  const [activeView, setActiveView] = useState<'conversations' | 'all-messages'>('conversations');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'blocked'>('all');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  const conversations: Conversation[] = [
    {
      id: 'CONV001',
      student: 'Alice Uwimana (P5 A)',
      teacher: 'Sarah Kayitesi (Mathematics)',
      lastMessage: 'Thank you for explaining the algebra problem, I understand now.',
      lastDate: '10 minutes ago',
      messageCount: 8,
      unreadCount: 0,
      status: 'active'
    },
    {
      id: 'CONV002',
      student: 'David Ndayisaba (P6 B)',
      teacher: 'John Mugabe (Science)',
      lastMessage: 'Can you help me with the chemistry homework?',
      lastDate: '1 hour ago',
      messageCount: 5,
      unreadCount: 1,
      status: 'active'
    },
    {
      id: 'CONV003',
      student: 'Grace Mutesi (P4 C)',
      teacher: 'Marie Claire (English)',
      lastMessage: 'I will submit the essay tomorrow morning.',
      lastDate: '3 hours ago',
      messageCount: 12,
      unreadCount: 0,
      status: 'active'
    },
    {
      id: 'CONV004',
      student: 'Jean Paul Manzi (P5 A)',
      teacher: 'Eric Ndayisaba (History)',
      lastMessage: 'When is the next test?',
      lastDate: '1 day ago',
      messageCount: 3,
      unreadCount: 0,
      status: 'blocked'
    },
  ];

  const allMessages: Message[] = [
    {
      id: 'MSG001',
      sender: 'Alice Uwimana',
      senderId: 'STU001',
      senderRole: 'student',
      receiver: 'Sarah Kayitesi',
      receiverId: 'TCH001',
      receiverRole: 'teacher',
      messageText: 'Good morning teacher, I don\'t understand question 5 on page 42. Can you explain it?',
      createdAt: '2024-01-15 08:30:00',
      status: 'active',
      schoolId: 'SCH001'
    },
    {
      id: 'MSG002',
      sender: 'Sarah Kayitesi',
      senderId: 'TCH001',
      senderRole: 'teacher',
      receiver: 'Alice Uwimana',
      receiverId: 'STU001',
      receiverRole: 'student',
      messageText: 'Good morning Alice! Question 5 is about solving for x. First, you need to isolate the variable on one side. Let me break it down: 2x + 5 = 15. Subtract 5 from both sides to get 2x = 10, then divide by 2 to get x = 5.',
      createdAt: '2024-01-15 09:15:00',
      status: 'active',
      schoolId: 'SCH001'
    },
    {
      id: 'MSG003',
      sender: 'Alice Uwimana',
      senderId: 'STU001',
      senderRole: 'student',
      receiver: 'Sarah Kayitesi',
      receiverId: 'TCH001',
      receiverRole: 'teacher',
      messageText: 'Thank you for explaining the algebra problem, I understand now.',
      createdAt: '2024-01-15 09:45:00',
      status: 'active',
      schoolId: 'SCH001'
    },
    {
      id: 'MSG004',
      sender: 'David Ndayisaba',
      senderId: 'STU002',
      senderRole: 'student',
      receiver: 'John Mugabe',
      receiverId: 'TCH002',
      receiverRole: 'teacher',
      messageText: 'Can you help me with the chemistry homework?',
      createdAt: '2024-01-15 10:30:00',
      status: 'active',
      schoolId: 'SCH001'
    },
    {
      id: 'MSG005',
      sender: 'Grace Mutesi',
      senderId: 'STU003',
      senderRole: 'student',
      receiver: 'Marie Claire',
      receiverId: 'TCH003',
      receiverRole: 'teacher',
      messageText: 'I will submit the essay tomorrow morning.',
      createdAt: '2024-01-15 11:00:00',
      status: 'active',
      schoolId: 'SCH001'
    },
  ];

  const messageStats = [
    { label: 'Total Conversations', value: 24, icon: 'ri-chat-3-line', color: 'bg-blue-100 text-blue-600' },
    { label: 'Active Today', value: 8, icon: 'ri-message-3-line', color: 'bg-green-100 text-green-600' },
    { label: 'Pending Review', value: 3, icon: 'ri-alert-line', color: 'bg-amber-100 text-amber-600' },
    { label: 'Blocked', value: 1, icon: 'ri-forbid-line', color: 'bg-red-100 text-red-600' },
  ];

  const getConversationMessages = (convId: string) => {
    // In real implementation, filter messages by conversation
    return allMessages.slice(0, 3);
  };

  const handleBlockConversation = (convId: string) => {
    setShowBlockModal(false);
    // In real implementation, update conversation status to 'blocked'
    alert('Conversation blocked successfully');
  };

  const handleDeleteMessage = (msgId: string) => {
    setShowDeleteModal(false);
    // In real implementation, update message status to 'deleted'
    alert('Message deleted successfully');
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.teacher.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || conv.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Message Monitoring</h2>
          <p className="text-sm text-gray-600">Monitor and control all student-teacher communications</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {messageStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
                <i className={`${stat.icon} text-lg`}></i>
              </div>
              <span className="text-sm text-gray-600">{stat.label}</span>
            </div>
            <div className="text-2xl font-black text-gray-900">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Message Interface */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex h-[600px]">
          {/* Sidebar */}
          <div className="w-96 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <div className="relative mb-3">
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveView('conversations')}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                    activeView === 'conversations' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <i className="ri-chat-3-line mr-1"></i>
                  Conversations
                </button>
                <button
                  onClick={() => setActiveView('all-messages')}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                    activeView === 'all-messages' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <i className="ri-message-3-line mr-1"></i>
                  All Messages
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {activeView === 'conversations' ? (
                <div className="divide-y divide-gray-100">
                  {filteredConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv.id)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                        selectedConversation === conv.id ? 'bg-teal-50 border-l-4 border-teal-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <i className="ri-user-line text-blue-600"></i>
                            <span className="font-semibold text-gray-900 text-sm truncate">{conv.student}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <i className="ri-user-star-line text-purple-600"></i>
                            <span className="text-sm text-gray-600 truncate">{conv.teacher}</span>
                          </div>
                        </div>
                        {conv.status === 'blocked' && (
                          <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-full whitespace-nowrap">
                            Blocked
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-700 truncate mb-2">{conv.lastMessage}</div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{conv.lastDate}</span>
                        <span>{conv.messageCount} messages</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {allMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            msg.senderRole === 'student' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                          }`}>
                            <i className={msg.senderRole === 'student' ? 'ri-user-line text-sm' : 'ri-user-star-line text-sm'}></i>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-sm">{msg.sender}</div>
                            <div className="text-xs text-gray-500">{msg.senderRole}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedMessageId(msg.id);
                            setShowDeleteModal(true);
                          }}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete message"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                      <div className="text-sm text-gray-700 mb-2">{msg.messageText}</div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <i className="ri-arrow-right-line"></i>
                        <span>{msg.receiver}</span>
                        <span className="ml-auto">{new Date(msg.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Conversation Detail */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Conversation Details</h3>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <i className="ri-user-line text-blue-600"></i>
                          <span className="text-gray-600">Student:</span>
                          <span className="font-medium text-gray-900">
                            {conversations.find(c => c.id === selectedConversation)?.student}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <i className="ri-user-star-line text-purple-600"></i>
                          <span className="text-gray-600">Teacher:</span>
                          <span className="font-medium text-gray-900">
                            {conversations.find(c => c.id === selectedConversation)?.teacher}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {conversations.find(c => c.id === selectedConversation)?.status === 'active' ? (
                        <button
                          onClick={() => {
                            setShowBlockModal(true);
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm whitespace-nowrap"
                        >
                          <i className="ri-forbid-line mr-2"></i>
                          Block Conversation
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBlockConversation(selectedConversation)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm whitespace-nowrap"
                        >
                          <i className="ri-check-line mr-2"></i>
                          Unblock Conversation
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
                  <div className="space-y-4">
                    {getConversationMessages(selectedConversation).map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.senderRole === 'student' ? 'justify-start' : 'justify-end'}`}
                      >
                        <div className={`max-w-[70%] ${msg.senderRole === 'student' ? 'bg-white' : 'bg-teal-600 text-white'} rounded-2xl p-4 shadow-sm`}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              msg.senderRole === 'student' ? 'bg-blue-100 text-blue-600' : 'bg-white/20 text-white'
                            }`}>
                              <i className={msg.senderRole === 'student' ? 'ri-user-line text-xs' : 'ri-user-star-line text-xs'}></i>
                            </div>
                            <span className={`font-semibold text-sm ${msg.senderRole === 'student' ? 'text-gray-900' : 'text-white'}`}>
                              {msg.sender}
                            </span>
                          </div>
                          <p className={`text-sm ${msg.senderRole === 'student' ? 'text-gray-700' : 'text-white'}`}>
                            {msg.messageText}
                          </p>
                          <div className={`text-xs mt-2 ${msg.senderRole === 'student' ? 'text-gray-500' : 'text-white/70'}`}>
                            {new Date(msg.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-amber-50">
                  <div className="flex items-center gap-2 text-sm text-amber-800">
                    <i className="ri-information-line"></i>
                    <span>Director monitoring mode - Read-only view. Students and teachers can send messages normally.</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="ri-chat-3-line text-3xl text-gray-400"></i>
                  </div>
                  <p className="text-gray-600">Select a conversation to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Block Confirmation Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-forbid-line text-2xl text-red-600"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Block Conversation?</h3>
            <p className="text-gray-600 text-center mb-6">
              This will prevent the student and teacher from sending further messages in this conversation.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBlockModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                onClick={() => selectedConversation && handleBlockConversation(selectedConversation)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
              >
                Block
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-delete-bin-line text-2xl text-red-600"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Delete Message?</h3>
            <p className="text-gray-600 text-center mb-6">
              This message will be permanently deleted and cannot be recovered.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                onClick={() => selectedMessageId && handleDeleteMessage(selectedMessageId)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}