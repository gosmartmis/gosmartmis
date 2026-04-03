import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, isOpen = false, onClose }: SidebarProps) {
  const navigate = window.REACT_APP_NAVIGATE;

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    onClose?.();
  };

  const handleSignOut = () => {
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static top-0 left-0 z-40
        w-64 bg-white border-r border-gray-200 h-screen flex flex-col
        transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 md:p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-teal-600">Go Smart M.I.S</h1>
            <p className="text-xs text-gray-600 mt-1">Registrar Portal</p>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <button
            onClick={() => handleTabChange('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-teal-50 text-teal-600'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <i className="ri-dashboard-line w-5 h-5 flex items-center justify-center"></i>
            Dashboard
          </button>

          <button
            onClick={() => handleTabChange('registration')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'registration'
                ? 'bg-teal-50 text-teal-600'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <i className="ri-user-add-line w-5 h-5 flex items-center justify-center"></i>
            Student Registration
          </button>

          <button
            onClick={() => handleTabChange('enrollment')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'enrollment'
                ? 'bg-teal-50 text-teal-600'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <i className="ri-file-list-3-line w-5 h-5 flex items-center justify-center"></i>
            Enrollment Management
          </button>

          <button
            onClick={() => handleTabChange('re-enrollment')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 're-enrollment'
                ? 'bg-teal-50 text-teal-600'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <i className="ri-refresh-line w-5 h-5 flex items-center justify-center"></i>
            Re-Enrollment
          </button>

          <button
            onClick={() => handleTabChange('teachers')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'teachers'
                ? 'bg-teal-50 text-teal-600'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <i className="ri-team-line w-5 h-5 flex items-center justify-center"></i>
            Teacher Management
          </button>

          <button
            onClick={() => handleTabChange('documents')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'documents'
                ? 'bg-teal-50 text-teal-600'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <i className="ri-folder-line w-5 h-5 flex items-center justify-center"></i>
            Documents
          </button>

          <button
            onClick={() => handleTabChange('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'notifications'
                ? 'bg-teal-50 text-teal-600'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <i className="ri-notification-3-line w-5 h-5 flex items-center justify-center"></i>
            Notifications
          </button>

          <button
            onClick={() => handleTabChange('messages')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'messages'
                ? 'bg-teal-50 text-teal-600'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <i className="ri-message-3-line w-5 h-5 flex items-center justify-center"></i>
            Messages
          </button>

          <button
            onClick={() => handleTabChange('settings')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-teal-50 text-teal-600'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <i className="ri-settings-3-line w-5 h-5 flex items-center justify-center"></i>
            Settings
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 transition-colors whitespace-nowrap cursor-pointer"
          >
            <i className="ri-logout-box-line w-5 h-5 flex items-center justify-center"></i>
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
