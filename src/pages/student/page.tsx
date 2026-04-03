import { useState } from 'react';
import DemoBanner from '../../components/feature/DemoBanner';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Marks from './components/Marks';
import MyReportCard from './components/MyReportCard';
import Attendance from './components/Attendance';
import Timetable from './components/Timetable';
import HolidayAssignments from './components/HolidayAssignments';
import Messages from './components/Messages';
import Settings from './components/Settings';

export default function StudentPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DemoBanner role="student" />
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
          {activeTab === 'marks' && <Marks />}
          {activeTab === 'report-card' && <MyReportCard />}
          {activeTab === 'attendance' && <Attendance />}
          {activeTab === 'timetable' && <Timetable />}
          {activeTab === 'holiday-assignments' && <HolidayAssignments />}
          {activeTab === 'messages' && <Messages />}
          {activeTab === 'settings' && <Settings />}
        </main>
      </div>
    </div>
  );
}