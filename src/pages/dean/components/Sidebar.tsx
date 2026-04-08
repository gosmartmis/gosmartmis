import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
  alertCount?: number;
}

interface NavItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  isOpen = false,
  onClose,
  alertCount = 0,
}: SidebarProps) {
  const navigate = useNavigate();

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    onClose?.();
  };

  const navItems: NavItem[] = [
    { id: 'dashboard',           label: 'Dashboard',            icon: 'ri-dashboard-line' },
    { id: 'classes',             label: 'Classes',              icon: 'ri-building-line' },
    { id: 'subjects',            label: 'Subjects',             icon: 'ri-book-open-line' },
    { id: 'teacher-assignments', label: 'Teacher Assignments',  icon: 'ri-user-settings-line', badge: alertCount },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed lg:static top-0 left-0 z-40
        w-64 bg-gray-900 text-white h-screen flex flex-col
        transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold">Go Smart M.I.S</h1>
            <p className="text-xs text-gray-400 mt-0.5">Dean Portal</p>
          </div>
          <button onClick={onClose}
            className="lg:hidden w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white cursor-pointer">
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
                  isActive ? 'bg-teal-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                  <i className={`${item.icon} text-lg`}></i>
                </div>
                <span className="text-sm font-medium flex-1 text-left">{item.label}</span>

                {/* Alert badge */}
                {item.badge != null && item.badge > 0 && (
                  <span className={`min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold flex items-center justify-center ${
                    isActive ? 'bg-white text-teal-700' : 'bg-red-500 text-white'
                  }`}>
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div className="p-4 border-t border-gray-800 flex-shrink-0">
          <button
            onClick={() => navigate('/login')}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 transition-colors text-white cursor-pointer whitespace-nowrap"
          >
            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
              <i className="ri-logout-box-line text-lg"></i>
            </div>
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
