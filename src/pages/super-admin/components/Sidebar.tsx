import { useNavigate } from 'react-router-dom';
import { useTestimonialSubmissions } from '../../../hooks/useTestimonialSubmissions';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const { submissions } = useTestimonialSubmissions();
  const pendingCount = submissions.filter((s) => s.status === 'pending').length;

  const menuItems = [
    { id: 'dashboard', icon: 'ri-dashboard-line', label: 'Dashboard' },
    { id: 'schools', icon: 'ri-building-line', label: 'Schools' },
    { id: 'subscriptions', icon: 'ri-bank-card-line', label: 'Subscriptions' },
    { id: 'users', icon: 'ri-user-line', label: 'Users' },
    { id: 'analytics', icon: 'ri-bar-chart-line', label: 'Analytics' },
    { id: 'audit-log', icon: 'ri-shield-check-line', label: 'Audit Log' },
    { id: 'landing-editor', icon: 'ri-edit-2-line', label: 'Landing Editor', badge: pendingCount },
    { id: 'settings', icon: 'ri-settings-line', label: 'Settings' },
    { id: 'seed-users', icon: 'ri-user-add-line', label: 'Test Accounts' },
    { id: 'system-inspector', icon: 'ri-bug-2-line', label: 'Debug & Inspector' },
  ];

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 bg-slate-900 text-white flex flex-col
        transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img
              src="https://public.readdy.ai/ai/img_res/1bf0ff4a-a6ed-4759-a280-82047bb4bb6b.png"
              alt="Logo"
              className="h-10 w-10 object-contain"
            />
            <div>
              <div className="font-bold text-lg">Go Smart M.I.S</div>
              <div className="text-xs text-gray-400">Super Admin</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === item.id
                      ? 'bg-teal-600 text-white'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <i className={`${item.icon} text-xl w-6 h-6 flex items-center justify-center`}></i>
                  <span className="font-medium flex-1 text-left">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center leading-none">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-all cursor-pointer whitespace-nowrap"
          >
            <i className="ri-logout-box-line text-xl w-6 h-6 flex items-center justify-center"></i>
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}