import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Schools from './components/Schools';
import Subscriptions from './components/Subscriptions';
import Users from './components/Users';
import Analytics from './components/Analytics';
import AuditLog from './components/AuditLog';
import Settings from './components/Settings';
import SeedUsers from './components/SeedUsers';
import LandingEditor from './components/LandingEditor';
import SystemInspector from './components/SystemInspector';

export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'schools' | 'subscriptions' | 'users' | 'analytics' | 'audit-log' | 'settings' | 'seed-users' | 'landing-editor' | 'system-inspector'>(
    'dashboard'
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'schools':
        return <Schools />;
      case 'subscriptions':
        return <Subscriptions />;
      case 'users':
        return <Users />;
      case 'analytics':
        return <Analytics />;
      case 'audit-log':
        return <AuditLog />;
      case 'settings':
        return <Settings />;
      case 'seed-users':
        return <SeedUsers />;
      case 'landing-editor':
        return <LandingEditor />;
      case 'system-inspector':
        return <SystemInspector />;
      default:
        return <div className="text-red-600">Invalid tab selected.</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={(tab) => {
            setActiveTab(tab as typeof activeTab);
            setSidebarOpen(false);
          }}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
