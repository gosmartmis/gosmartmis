import { useState } from 'react';
import DemoBanner from '../../components/feature/DemoBanner';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import StudentRegistration from './components/StudentRegistration';
import EnrollmentManagement from './components/EnrollmentManagement';
import ReEnrollment from './components/ReEnrollment';
import TeacherManagement from './components/TeacherManagement';
import Documents from './components/Documents';
import Notifications from './components/Notifications';
import Messages from './components/Messages';
import Settings from './components/Settings';

type TabType = 'dashboard' | 'registration' | 'enrollment' | 're-enrollment' | 'teachers' | 'documents' | 'notifications' | 'messages' | 'settings';

export default function RegistrarPage() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DemoBanner role="registrar" />
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setSidebarOpen(false);
          }}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8">
          {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
          {activeTab === 'registration' && <StudentRegistration />}
          {activeTab === 'enrollment' && <EnrollmentManagement />}
          {activeTab === 're-enrollment' && <ReEnrollment />}
          {activeTab === 'teachers' && <TeacherManagement />}
          {activeTab === 'documents' && <Documents />}
          {activeTab === 'notifications' && <Notifications />}
          {activeTab === 'messages' && <Messages />}
          {activeTab === 'settings' && <Settings />}
        </main>
      </div>
    </div>
  );
}