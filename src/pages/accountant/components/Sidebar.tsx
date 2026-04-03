import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'ri-dashboard-line' },
  { id: 'fee-management', label: 'Fee Management', icon: 'ri-file-list-3-line' },
  { id: 'payments', label: 'Payments', icon: 'ri-bank-card-line' },
  { id: 'stock', label: 'Stock Management', icon: 'ri-archive-line' },
  { id: 'payroll', label: 'Payroll', icon: 'ri-wallet-3-line' },
  { id: 'reports', label: 'Financial Reports', icon: 'ri-bar-chart-box-line' },
  { id: 'tax', label: 'Tax Management', icon: 'ri-government-line' },
  { id: 'messages', label: 'Messages', icon: 'ri-message-3-line' },
  { id: 'settings', label: 'Settings', icon: 'ri-settings-3-line' },
];

export default function Sidebar({ activeTab, setActiveTab, isOpen = false, onClose }: SidebarProps) {
  const navigate = useNavigate();

  const handleTabChange = (id: string) => {
    setActiveTab(id);
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
      <aside className={`
        fixed lg:static top-0 left-0 z-40
        w-64 bg-white border-r border-gray-200 h-screen flex flex-col
        transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-14 md:h-16 flex items-center gap-3 px-4 md:px-6 border-b border-gray-200 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
            <i className="ri-money-dollar-circle-line text-white text-lg" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-gray-900 truncate">Accountant</div>
            <div className="text-xs text-gray-500 truncate">Financial Management</div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer flex-shrink-0"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-1 cursor-pointer whitespace-nowrap ${
                activeTab === item.id
                  ? 'bg-amber-50 text-amber-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <i className={`${item.icon} text-base`} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={() => handleTabChange('risk-alerts')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-2 ${
              activeTab === 'risk-alerts'
                ? 'bg-amber-50 text-amber-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <i className="ri-alert-line text-xl"></i>
            <span className="text-sm font-medium">Fees Alerts</span>
          </button>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 transition-all cursor-pointer whitespace-nowrap"
          >
            <i className="ri-logout-box-line text-base" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
