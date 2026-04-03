interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const menuItems = [
  { id: 'dashboard',           label: 'Dashboard',              icon: 'ri-dashboard-line'            },
  { id: 'academic-overview',   label: 'Academic Overview',      icon: 'ri-book-open-line'             },
  { id: 'analytics',           label: 'Performance Analytics',  icon: 'ri-bar-chart-box-line'         },
  { id: 'top-students',        label: 'Top Students',           icon: 'ri-trophy-line'                },
  { id: 'marks-approval',      label: 'Marks Approval',         icon: 'ri-checkbox-circle-line'       },
  { id: 'report-cards',        label: 'Report Card Control',    icon: 'ri-file-text-line'             },
  { id: 'student-promotion',   label: 'Student Promotion',      icon: 'ri-user-star-line'             },
  { id: 'term-management',     label: 'Term Management',        icon: 'ri-calendar-line'              },
  { id: 'fee-config',          label: 'Fee Configuration',      icon: 'ri-money-dollar-circle-line'   },
  { id: 'academic-management', label: 'Academic Management',    icon: 'ri-graduation-cap-line'        },
  { id: 'school-management',   label: 'School Management',      icon: 'ri-building-line'              },
  { id: 'messages',            label: 'Messages Monitoring',    icon: 'ri-message-3-line'             },
  { id: 'risk-alerts',         label: 'Risk Alerts',            icon: 'ri-alert-line'                 },
  { id: 'settings',            label: 'Settings',               icon: 'ri-settings-3-line'            },
];

export default function Sidebar({ activeTab, setActiveTab, isOpen = false, onClose }: SidebarProps) {
  const handleSelect = (id: string) => {
    setActiveTab(id);
    onClose?.();
  };

  const NavList = () => (
    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
      {menuItems.map((item) => (
        <button
          key={item.id}
          onClick={() => handleSelect(item.id)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all whitespace-nowrap cursor-pointer ${
            activeTab === item.id
              ? 'bg-teal-50 text-teal-700 font-semibold'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <i className={`${item.icon} text-xl`}></i>
          <span className="text-sm">{item.label}</span>
        </button>
      ))}
    </nav>
  );

  return (
    <>
      {/* ── Desktop sidebar (always visible on lg+) ── */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-gray-200 flex-col">
        <NavList />
      </aside>

      {/* ── Mobile drawer overlay ── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/40" />
        </div>
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white border-r border-gray-200 z-50 flex flex-col transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <span className="text-lg font-bold text-gray-900">Menu</span>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            <i className="ri-close-line text-xl text-gray-600"></i>
          </button>
        </div>
        <NavList />
      </aside>
    </>
  );
}
