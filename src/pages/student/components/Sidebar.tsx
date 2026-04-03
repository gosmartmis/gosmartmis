import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

interface MenuItem {
  id: string;
  icon: string;
  label: string;
  badge?: string;
}

const menuItems: MenuItem[] = [
  { id: 'dashboard', icon: 'ri-dashboard-line', label: 'Dashboard' },
  { id: 'marks', icon: 'ri-bar-chart-line', label: 'My Marks' },
  { id: 'report-card', icon: 'ri-file-text-line', label: 'My Report Card' },
  { id: 'attendance', icon: 'ri-calendar-check-line', label: 'Attendance' },
  { id: 'timetable', icon: 'ri-time-line', label: 'Timetable' },
  { id: 'holiday-assignments', icon: 'ri-book-open-line', label: 'Holiday Assignments' },
  { id: 'messages', icon: 'ri-message-3-line', label: 'Messages', badge: '3' },
  { id: 'settings', icon: 'ri-settings-3-line', label: 'Settings' },
];

export default function Sidebar({ activeTab, setActiveTab, isOpen = false, onClose }: SidebarProps) {
  const navigate = useNavigate();

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    onClose?.();
  };

  const handleLogout = () => {
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
      <aside className={`
        fixed lg:static top-0 left-0 z-40
        w-64 sm:w-72 bg-white border-r border-gray-200 h-screen flex flex-col
        transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 md:p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <i className="ri-graduation-cap-line text-xl md:text-2xl text-white"></i>
            </div>
            <div className="min-w-0">
              <h1 className="text-base md:text-lg font-bold text-gray-900 truncate">Elite School</h1>
              <p className="text-xs text-gray-600 truncate">Student Portal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer flex-shrink-0"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        <nav className="flex-1 p-3 md:p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 md:px-4 py-2.5 md:py-3 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2.5 md:gap-3 flex-1 min-w-0">
                <i className={`${item.icon} text-lg md:text-xl w-5 h-5 md:w-6 md:h-6 flex items-center justify-center flex-shrink-0`}></i>
                <span className="font-medium text-sm md:text-base truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full flex-shrink-0 ${
                  activeTab === item.id ? 'bg-white/20 text-white' : 'bg-red-500 text-white'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 md:p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer whitespace-nowrap"
          >
            <i className="ri-logout-box-line text-lg md:text-xl w-5 h-5 md:w-6 md:h-6 flex items-center justify-center"></i>
            <span className="font-medium text-sm md:text-base">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
