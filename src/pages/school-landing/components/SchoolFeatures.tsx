import { useNavigate } from 'react-router-dom';
import type { SchoolRecord, SchoolColors } from '../types';

interface Props {
  school: SchoolRecord;
  colors: SchoolColors;
}

const FEATURES = [
  { icon: 'ri-file-text-line', title: 'Digital Report Cards', desc: 'Access term report cards online anytime. Download, print, or share with a single tap.' },
  { icon: 'ri-bar-chart-2-line', title: 'Real-Time Grades', desc: 'Track academic performance per subject across all terms with detailed breakdowns.' },
  { icon: 'ri-calendar-check-line', title: 'Attendance Tracking', desc: 'Stay informed about daily attendance records and get instant absence notifications.' },
  { icon: 'ri-time-line', title: 'Class Timetable', desc: 'View the complete weekly schedule for all classes and subjects in one place.' },
  { icon: 'ri-message-3-line', title: 'Direct Messaging', desc: 'Communicate directly with teachers, the dean, and administration securely.' },
  { icon: 'ri-money-dollar-circle-line', title: 'Fee Tracking', desc: 'Check outstanding balances, payment history, and fee structures online.' },
  { icon: 'ri-book-open-line', title: 'Holiday Assignments', desc: 'Access and download holiday assignments and learning materials anywhere.' },
  { icon: 'ri-notification-3-line', title: 'Smart Notifications', desc: 'Get instant alerts for new marks, messages, announcements, and reminders.' },
  { icon: 'ri-award-line', title: 'Performance Analytics', desc: 'See trends, ranking, and improvement tracking across academic periods.' },
];

export default function SchoolFeatures({ colors }: Props) {
  const navigate = useNavigate();

  return (
    <section id="features" className="py-14 md:py-20 px-4 md:px-8" style={colors.lightBg}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 md:mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4" style={{ ...{ backgroundColor: colors.primary + '15' }, ...colors.text }}>Student Portal</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">Everything You Need, Online</h2>
          <p className="text-gray-500 text-sm md:text-base max-w-2xl mx-auto">
            Our student portal gives parents, students, and teachers instant access to everything — from anywhere, on any device.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-10">
          {FEATURES.map((feat, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 md:p-6 border border-gray-100 hover:border-gray-200 transition-all group cursor-default">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform" style={colors.iconBg}>
                <i className={`${feat.icon} text-lg`}></i>
              </div>
              <h4 className="font-bold text-gray-900 mb-1.5 text-sm md:text-base">{feat.title}</h4>
              <p className="text-xs md:text-sm text-gray-500 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-2.5 px-7 py-3.5 text-white rounded-2xl font-bold text-sm hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
            style={colors.btn}
          >
            <i className="ri-login-box-line text-base"></i>Access the Student Portal
          </button>
        </div>
      </div>
    </section>
  );
}
