import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ activeSection, onSectionChange, isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSignOut = () => {
    navigate('/login');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'ri-dashboard-line' },
    { id: 'academic-overview', label: 'Academic Overview', icon: 'ri-book-open-line' },
    { id: 'analytics', label: 'Performance Analytics', icon: 'ri-bar-chart-box-line' },
    { id: 'top-students', label: 'Top Students', icon: 'ri-trophy-line' },
    { id: 'marks-approval', label: 'Final Marks Approval', icon: 'ri-shield-check-line' },
    { id: 'report-cards', label: 'Report Card Control', icon: 'ri-file-text-line' },
    { id: 'student-promotion', label: 'Student Promotion', icon: 'ri-user-star-line' },
    { id: 'term-management', label: 'Term Management', icon: 'ri-calendar-line' },
    { id: 'fee-config', label: 'Fee Configuration', icon: 'ri-money-dollar-circle-line' },
    { id: 'academic-management', label: 'Academic Management', icon: 'ri-graduation-cap-line' },
    { id: 'school-management', label: 'School Management', icon: 'ri-building-line' },
    { id: 'messages', label: 'Messages Monitoring', icon: 'ri-message-3-line' },
    { id: 'user-management', label: 'User Accounts', icon: 'ri-team-line' },
    { id: 'activity-log', label: 'Activity Log', icon: 'ri-history-line' },
    { id: 'risk-alerts', label: 'Risk Alerts', icon: 'ri-alert-line' },
    { id: 'settings', label: 'Settings', icon: 'ri-settings-3-line' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-gray-900 text-white
          flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <i className="ri-graduation-cap-line text-xl text-white"></i>
              </div>
              <div>
                <h1 className="text-lg font-bold">Go Smart M.I.S</h1>
                <p className="text-xs text-gray-400">Director Portal</p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeSection === item.id
                  ? 'bg-teal-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <i className={`${item.icon} text-xl w-5 h-5 flex items-center justify-center`}></i>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Sign Out Button */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 transition-colors text-white cursor-pointer whitespace-nowrap"
          >
            <i className="ri-logout-box-line text-xl w-5 h-5 flex items-center justify-center"></i>
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}