import { useState } from 'react';
import DemoBanner from '../../components/feature/DemoBanner';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import MyClasses from './components/MyClasses';
import MarksEntry from './components/MarksEntry';
import MarksApproval from './components/MarksApproval';
import Attendance from './components/Attendance';
import Timetable from './components/Timetable';
import HolidayPackages from './components/HolidayPackages';
import Messages from './components/Messages';
import Settings from './components/Settings';

export default function TeacherPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DemoBanner role="teacher" />
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
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'my-classes' && <MyClasses />}
          {activeTab === 'marks-entry' && <MarksEntry />}
          {activeTab === 'marks-approval' && <MarksApproval />}
          {activeTab === 'attendance' && <Attendance />}
          {activeTab === 'timetable' && <Timetable />}
          {activeTab === 'holiday-packages' && <HolidayPackages />}
          {activeTab === 'messages' && <Messages />}
          {activeTab === 'settings' && <Settings />}
        </main>
      </div>
    </div>
  );
}