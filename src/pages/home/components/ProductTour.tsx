import { useState, useEffect, useCallback } from 'react';

interface TourStep {
  id: number;
  label: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  badge: string;
}

const STEPS: TourStep[] = [
  {
    id: 1,
    label: 'Dashboard',
    title: 'Unified School Dashboard',
    description: 'Every role — Director, Dean, Teacher, Accountant — gets their own tailored dashboard with live stats, alerts, and quick actions. No clutter, just what matters.',
    icon: 'ri-dashboard-3-line',
    color: 'teal',
    badge: 'Role-based views',
  },
  {
    id: 2,
    label: 'Marks & Grades',
    title: '3-Layer Marks Approval',
    description: 'Teachers enter marks, Deans verify them, Directors give final approval. Nothing slips through — every grade is tracked and audited at every step.',
    icon: 'ri-file-list-3-line',
    color: 'emerald',
    badge: 'Teacher → Dean → Director',
  },
  {
    id: 3,
    label: 'Attendance',
    title: 'Daily Attendance Tracking',
    description: 'Mark attendance class by class, track trends over time, and get automatic alerts for at-risk students with too many absences. All in real time.',
    icon: 'ri-calendar-check-line',
    color: 'cyan',
    badge: 'AI risk alerts',
  },
  {
    id: 4,
    label: 'Fee & Finance',
    title: 'Smart Fee Management',
    description: 'Track every payment, generate invoices, send reminders automatically, and view financial reports in seconds. The accountant\'s best friend.',
    icon: 'ri-money-dollar-circle-line',
    color: 'amber',
    badge: 'Auto-reminders',
  },
  {
    id: 5,
    label: 'Report Cards',
    title: 'One-Click Report Cards',
    description: 'Publish polished, professional report cards for all students simultaneously. Parents get notified, teachers save hours of manual work every term.',
    icon: 'ri-award-line',
    color: 'rose',
    badge: 'Bulk publish',
  },
  {
    id: 6,
    label: 'Analytics',
    title: 'Deep Academic Analytics',
    description: 'Class averages, subject pass rates, top students, term-over-term trends — all in beautiful charts that help Directors make data-driven decisions fast.',
    icon: 'ri-bar-chart-grouped-line',
    color: 'violet',
    badge: 'Trend analysis',
  },
];

const DURATION = 5000;

// ── Mock Screens ──────────────────────────────────────────────────────────────

function DashboardScreen() {
  return (
    <div className="h-full flex flex-col gap-3 p-4 bg-slate-50">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-slate-800">Good morning, Director</div>
          <div className="text-xs text-slate-400">Kigali Primary School · Term 2 · 2025</div>
        </div>
        <div className="flex gap-2">
          <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center"><i className="ri-notification-3-line text-teal-600 text-xs"></i></div>
          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center"><i className="ri-user-line text-slate-500 text-xs"></i></div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Students', value: '342', icon: 'ri-graduation-cap-line', color: 'bg-teal-500' },
          { label: 'Teachers', value: '28', icon: 'ri-user-star-line', color: 'bg-emerald-500' },
          { label: 'Attendance', value: '94%', icon: 'ri-calendar-check-line', color: 'bg-cyan-500' },
          { label: 'Fees Collected', value: '87%', icon: 'ri-money-dollar-circle-line', color: 'bg-amber-500' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-3 border border-slate-100">
            <div className={`w-7 h-7 ${s.color} rounded-lg flex items-center justify-center mb-2`}>
              <i className={`${s.icon} text-white text-xs`}></i>
            </div>
            <div className="text-lg font-black text-slate-800">{s.value}</div>
            <div className="text-xs text-slate-400">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 flex-1">
        <div className="col-span-2 bg-white rounded-xl p-3 border border-slate-100">
          <div className="text-xs font-bold text-slate-600 mb-3">Academic Performance</div>
          <div className="flex items-end gap-1 h-20">
            {[72, 85, 68, 91, 78, 88, 74, 82].map((h, i) => (
              <div key={i} className="flex-1 bg-teal-100 rounded-sm relative group cursor-pointer hover:bg-teal-200 transition-colors" style={{ height: `${h}%` }}>
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{h}%</div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-slate-300 mt-1">
            {['P1','P2','P3','P4','P5','P6','P7','P8'].map(p => <span key={p}>{p}</span>)}
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 border border-slate-100">
          <div className="text-xs font-bold text-slate-600 mb-2">Alerts</div>
          {[
            { msg: '3 low-attendance students', color: 'text-amber-500', icon: 'ri-alarm-warning-line' },
            { msg: 'Marks pending review', color: 'text-rose-500', icon: 'ri-error-warning-line' },
            { msg: 'Fees overdue: 14', color: 'text-orange-500', icon: 'ri-bill-line' },
          ].map((a, i) => (
            <div key={i} className="flex items-start gap-1.5 mb-2">
              <i className={`${a.icon} ${a.color} text-xs mt-0.5`}></i>
              <span className="text-xs text-slate-600 leading-tight">{a.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MarksScreen() {
  return (
    <div className="h-full flex flex-col gap-3 p-4 bg-slate-50">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-slate-800">Marks Entry — P5A</div>
          <div className="text-xs text-slate-400">Mathematics · Mid-Term · 18 students</div>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1 bg-teal-100 text-teal-700 text-xs rounded-full font-semibold">Draft</div>
          <div className="px-3 py-1 bg-slate-200 text-slate-600 text-xs rounded-full font-semibold cursor-pointer hover:bg-slate-300 transition-colors">Submit for Review</div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden flex-1">
        <div className="grid grid-cols-5 bg-slate-50 border-b border-slate-100 px-3 py-2 text-xs font-bold text-slate-500">
          <div className="col-span-2">Student</div>
          <div className="text-center">Score /100</div>
          <div className="text-center">Grade</div>
          <div className="text-center">Status</div>
        </div>
        {[
          { name: 'Amara Ingabire', score: 87, grade: 'A', status: 'saved' },
          { name: 'David Hakizimana', score: 72, grade: 'B', status: 'saved' },
          { name: 'Grace Uwimana', score: 95, grade: 'A+', status: 'saved' },
          { name: 'Patrick Nzeyimana', score: 58, grade: 'C', status: 'editing' },
          { name: 'Sandrine Mukamana', score: 81, grade: 'A-', status: 'saved' },
          { name: 'Jean Habimana', score: 64, grade: 'B-', status: 'saved' },
          { name: 'Irene Nyirahabimana', score: 90, grade: 'A', status: 'saved' },
        ].map((s, i) => (
          <div key={i} className={`grid grid-cols-5 items-center px-3 py-2 border-b border-slate-50 text-xs ${s.status === 'editing' ? 'bg-amber-50' : ''}`}>
            <div className="col-span-2 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-emerald-400 flex items-center justify-center text-white text-xs font-bold">{s.name[0]}</div>
              <span className="text-slate-700 font-medium">{s.name}</span>
            </div>
            <div className="text-center">
              {s.status === 'editing' ? (
                <input className="w-14 text-center border border-amber-300 rounded text-xs p-0.5 bg-white" defaultValue={s.score} />
              ) : (
                <span className="text-slate-800 font-semibold">{s.score}</span>
              )}
            </div>
            <div className="text-center">
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${s.grade.startsWith('A') ? 'bg-emerald-100 text-emerald-700' : s.grade.startsWith('B') ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'}`}>{s.grade}</span>
            </div>
            <div className="text-center">
              {s.status === 'editing' ? (
                <span className="text-amber-500 font-medium">Editing</span>
              ) : (
                <i className="ri-check-line text-emerald-500"></i>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <div className="flex-1 bg-white border border-slate-100 rounded-xl p-3 text-center">
          <div className="text-xl font-black text-slate-800">78.2</div>
          <div className="text-xs text-slate-400">Class Average</div>
        </div>
        <div className="flex-1 bg-white border border-slate-100 rounded-xl p-3 text-center">
          <div className="text-xl font-black text-emerald-600">14/18</div>
          <div className="text-xs text-slate-400">Passed</div>
        </div>
        <div className="flex-1 bg-white border border-slate-100 rounded-xl p-3 text-center">
          <div className="text-xl font-black text-rose-500">4/18</div>
          <div className="text-xs text-slate-400">Need Support</div>
        </div>
      </div>
    </div>
  );
}

function AttendanceScreen() {
  const days = ['Mon','Tue','Wed','Thu','Fri'];
  const students = [
    { name: 'Amara I.', marks: [1,1,1,1,1] },
    { name: 'David H.', marks: [1,0,1,1,1] },
    { name: 'Grace U.', marks: [1,1,1,1,1] },
    { name: 'Patrick N.', marks: [1,1,0,0,1] },
    { name: 'Sandrine M.', marks: [1,1,1,0,1] },
    { name: 'Jean H.', marks: [1,1,1,1,1] },
  ];
  return (
    <div className="h-full flex flex-col gap-3 p-4 bg-slate-50">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-slate-800">Attendance — P5A</div>
          <div className="text-xs text-slate-400">Week 3, Term 2 · June 2025</div>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
            <span className="text-xs text-emerald-700 font-semibold">94% this week</span>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden flex-1">
        <div className="grid grid-cols-6 bg-slate-50 border-b border-slate-100 px-3 py-2 text-xs font-bold text-slate-500">
          <div className="col-span-2">Student</div>
          {days.map(d => <div key={d} className="text-center">{d}</div>)}
        </div>
        {students.map((s, i) => (
          <div key={i} className="grid grid-cols-6 items-center px-3 py-2.5 border-b border-slate-50 text-xs">
            <div className="col-span-2 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-teal-400 flex items-center justify-center text-white text-xs font-bold">{s.name[0]}</div>
              <span className="text-slate-700 font-medium">{s.name}</span>
            </div>
            {s.marks.map((m, j) => (
              <div key={j} className="flex justify-center">
                {m === 1
                  ? <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center"><i className="ri-check-line text-emerald-600 text-xs"></i></div>
                  : <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center"><i className="ri-close-line text-rose-500 text-xs"></i></div>
                }
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
        <i className="ri-alarm-warning-line text-amber-500 text-base"></i>
        <div className="flex-1">
          <div className="text-xs font-bold text-amber-700">Risk Alert — Patrick N.</div>
          <div className="text-xs text-amber-600">2 absences this week · 6 total this term. Consider counseling.</div>
        </div>
        <div className="px-2 py-1 bg-amber-200 text-amber-800 text-xs rounded-lg cursor-pointer hover:bg-amber-300 transition-colors whitespace-nowrap">Review</div>
      </div>
    </div>
  );
}

function FeeScreen() {
  return (
    <div className="h-full flex flex-col gap-3 p-4 bg-slate-50">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-slate-800">Fee Management</div>
          <div className="text-xs text-slate-400">Term 2, 2025 · 342 students</div>
        </div>
        <div className="px-3 py-1.5 bg-teal-600 text-white text-xs rounded-lg cursor-pointer hover:bg-teal-700 transition-colors font-semibold whitespace-nowrap">Send Reminders</div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Total Expected', value: 'RWF 51.3M', color: 'text-slate-800', bg: 'bg-white' },
          { label: 'Collected', value: 'RWF 44.6M', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
          { label: 'Outstanding', value: 'RWF 6.7M', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} border border-slate-100 rounded-xl p-3`}>
            <div className={`text-base font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-slate-100 flex-1 overflow-hidden">
        <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600">Recent Payments</span>
          <span className="text-xs text-teal-600 cursor-pointer hover:underline">View all</span>
        </div>
        {[
          { name: 'Amara Ingabire', class: 'P5A', amount: 'RWF 150,000', date: 'Today 09:14', status: 'paid' },
          { name: 'David Hakizimana', class: 'P3B', amount: 'RWF 150,000', date: 'Today 08:42', status: 'paid' },
          { name: 'Grace Uwimana', class: 'P6A', amount: 'RWF 75,000', date: 'Yesterday', status: 'partial' },
          { name: 'Jean Habimana', class: 'P1C', amount: 'RWF 150,000', date: 'Jun 10', status: 'overdue' },
          { name: 'Irene Nyira.', class: 'P4B', amount: 'RWF 150,000', date: 'Jun 9', status: 'paid' },
        ].map((r, i) => (
          <div key={i} className="flex items-center px-3 py-2 border-b border-slate-50 gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{r.name[0]}</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-700 truncate">{r.name}</div>
              <div className="text-xs text-slate-400">{r.class} · {r.date}</div>
            </div>
            <div className="text-xs font-bold text-slate-700 whitespace-nowrap">{r.amount}</div>
            <div className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${r.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : r.status === 'partial' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
              {r.status === 'paid' ? 'Paid' : r.status === 'partial' ? 'Partial' : 'Overdue'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportCardScreen() {
  return (
    <div className="h-full flex flex-col gap-3 p-4 bg-slate-50">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-slate-800">Report Cards — Term 2</div>
          <div className="text-xs text-slate-400">342 students · All classes ready</div>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs rounded-lg font-semibold cursor-pointer whitespace-nowrap">Preview</div>
          <div className="px-3 py-1.5 bg-rose-600 text-white text-xs rounded-lg font-semibold cursor-pointer hover:bg-rose-700 transition-colors whitespace-nowrap">Publish All</div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-rose-100 p-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full"></div>
        <div className="relative flex items-start gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <i className="ri-award-line text-white text-xl"></i>
          </div>
          <div>
            <div className="text-sm font-bold text-slate-800">Sample · Grace Uwimana</div>
            <div className="text-xs text-slate-500">P6A · Term 2 Position: #1 of 42 students</div>
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {[
                { sub: 'Math', score: 95, grade: 'A+' },
                { sub: 'English', score: 88, grade: 'A' },
                { sub: 'Science', score: 91, grade: 'A+' },
                { sub: 'Kinyarwanda', score: 85, grade: 'A' },
              ].map((s) => (
                <div key={s.sub} className="bg-slate-50 rounded-lg p-1.5 text-center">
                  <div className="text-xs font-black text-slate-700">{s.score}</div>
                  <div className="text-xs text-slate-400">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-100 flex-1 overflow-hidden">
        <div className="grid grid-cols-4 bg-slate-50 border-b border-slate-100 px-3 py-2 text-xs font-bold text-slate-500">
          <div className="col-span-2">Class</div>
          <div className="text-center">Students</div>
          <div className="text-center">Status</div>
        </div>
        {[
          { cls: 'P1A', teacher: 'M. Uwera', count: 42, done: true },
          { cls: 'P2B', teacher: 'P. Ntare', count: 38, done: true },
          { cls: 'P3A', teacher: 'I. Mukasa', count: 45, done: true },
          { cls: 'P4C', teacher: 'D. Kagame', count: 40, done: false },
          { cls: 'P5A', teacher: 'S. Byiringiro', count: 42, done: true },
          { cls: 'P6A', teacher: 'A. Nkurunziza', count: 42, done: true },
        ].map((c, i) => (
          <div key={i} className="grid grid-cols-4 items-center px-3 py-2 border-b border-slate-50 text-xs">
            <div className="col-span-2">
              <div className="font-semibold text-slate-700">{c.cls}</div>
              <div className="text-slate-400">{c.teacher}</div>
            </div>
            <div className="text-center text-slate-600">{c.count}</div>
            <div className="flex justify-center">
              {c.done
                ? <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">Ready</span>
                : <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">Pending</span>
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsScreen() {
  const bars = [82, 75, 91, 68, 85, 78, 94, 72];
  const subjects = [
    { name: 'Mathematics', pass: 88, avg: 74 },
    { name: 'English', pass: 92, avg: 81 },
    { name: 'Science', pass: 79, avg: 69 },
    { name: 'Kinyarwanda', pass: 95, avg: 83 },
  ];
  return (
    <div className="h-full flex flex-col gap-3 p-4 bg-slate-50">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-slate-800">Academic Analytics</div>
          <div className="text-xs text-slate-400">All Classes · Term 2 vs Term 1 Comparison</div>
        </div>
        <div className="flex gap-1">
          {['Term 1','Term 2','Year'].map((t, i) => (
            <button key={t} className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${i === 1 ? 'bg-violet-600 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>{t}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white rounded-xl border border-slate-100 p-3">
          <div className="text-xs font-bold text-slate-600 mb-2">Class Averages</div>
          <div className="flex items-end gap-1 h-16">
            {bars.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-sm" style={{ height: `${h * 0.6}px`, background: `hsl(${160 + i * 8}, 60%, 50%)` }}></div>
                <span className="text-xs text-slate-300">{`P${i + 1}`}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-3">
          <div className="text-xs font-bold text-slate-600 mb-2">Top 3 Students — School</div>
          {[
            { name: 'Grace U.', class: 'P6A', avg: 92.5 },
            { name: 'Amara I.', class: 'P5A', avg: 90.1 },
            { name: 'Irene N.', class: 'P4B', avg: 88.7 },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-2 mb-1.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0 ${i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-slate-400' : 'bg-orange-400'}`}>{i + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-700 truncate">{s.name}</div>
                <div className="text-xs text-slate-400">{s.class}</div>
              </div>
              <div className="text-xs font-black text-violet-600">{s.avg}%</div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-100 flex-1 overflow-hidden">
        <div className="px-3 py-2 border-b border-slate-100 text-xs font-bold text-slate-600">Subject Pass Rates</div>
        {subjects.map((s, i) => (
          <div key={i} className="px-3 py-2 border-b border-slate-50 flex items-center gap-3">
            <div className="w-20 text-xs text-slate-600 font-medium truncate">{s.name}</div>
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${s.pass}%`, background: `hsl(160, 60%, ${40 + i * 5}%)` }}></div>
            </div>
            <div className="w-10 text-right text-xs font-bold text-slate-700">{s.pass}%</div>
            <div className="w-14 text-right text-xs text-slate-400">avg {s.avg}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const SCREENS = [
  DashboardScreen,
  MarksScreen,
  AttendanceScreen,
  FeeScreen,
  ReportCardScreen,
  AnalyticsScreen,
];

const COLOR_MAP: Record<string, { bg: string; ring: string; badge: string; barActive: string; numberBg: string }> = {
  teal:   { bg: 'bg-teal-500',   ring: 'ring-teal-500/30',   badge: 'bg-teal-100 text-teal-700',   barActive: 'bg-teal-500',   numberBg: 'bg-teal-500' },
  emerald:{ bg: 'bg-emerald-500',ring: 'ring-emerald-500/30',badge: 'bg-emerald-100 text-emerald-700',barActive: 'bg-emerald-500',numberBg: 'bg-emerald-500' },
  cyan:   { bg: 'bg-cyan-500',   ring: 'ring-cyan-500/30',   badge: 'bg-cyan-100 text-cyan-700',   barActive: 'bg-cyan-500',   numberBg: 'bg-cyan-500' },
  amber:  { bg: 'bg-amber-500',  ring: 'ring-amber-500/30',  badge: 'bg-amber-100 text-amber-700', barActive: 'bg-amber-500',  numberBg: 'bg-amber-500' },
  rose:   { bg: 'bg-rose-500',   ring: 'ring-rose-500/30',   badge: 'bg-rose-100 text-rose-700',   barActive: 'bg-rose-500',   numberBg: 'bg-rose-500' },
  violet: { bg: 'bg-violet-500', ring: 'ring-violet-500/30', badge: 'bg-violet-100 text-violet-700',barActive: 'bg-violet-500',numberBg: 'bg-violet-500' },
};

export default function ProductTour() {
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const goTo = useCallback((index: number) => {
    if (index === activeStep) return;
    setTransitioning(true);
    setTimeout(() => {
      setActiveStep(index);
      setProgress(0);
      setTransitioning(false);
    }, 180);
  }, [activeStep]);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          goTo((activeStep + 1) % STEPS.length);
          return 0;
        }
        return p + (100 / (DURATION / 80));
      });
    }, 80);
    return () => clearInterval(interval);
  }, [paused, activeStep, goTo]);

  const step = STEPS[activeStep];
  const colors = COLOR_MAP[step.color];
  const ScreenComponent = SCREENS[activeStep];

  return (
    <section id="demo" className="py-20 lg:py-28 bg-slate-900 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 mb-5">
            <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-teal-400 font-semibold tracking-widest uppercase">Interactive Demo</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4 leading-tight">
            See Everything In <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">2 Minutes</span>
          </h2>
          <p className="text-base sm:text-lg text-white/50 max-w-xl mx-auto">
            A full walkthrough of every module — from marks to money, attendance to analytics.
          </p>
        </div>

        {/* Tour layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 lg:gap-8 items-start">

          {/* ── Steps sidebar ── */}
          <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {STEPS.map((s, i) => {
              const isActive = i === activeStep;
              const c = COLOR_MAP[s.color];
              return (
                <button
                  key={s.id}
                  onClick={() => { goTo(i); setPaused(true); }}
                  className={`flex-shrink-0 lg:flex-shrink flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 cursor-pointer whitespace-nowrap lg:whitespace-normal ${
                    isActive
                      ? `bg-white/10 ring-1 ${c.ring} ring-inset`
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className={`w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0 transition-colors ${isActive ? c.bg : 'bg-white/10'}`}>
                    <i className={`${s.icon} text-white text-base`}></i>
                  </div>
                  <div className="hidden sm:block lg:block min-w-0">
                    <div className={`text-sm font-bold transition-colors ${isActive ? 'text-white' : 'text-white/50'}`}>{s.label}</div>
                    {isActive && (
                      <div className="mt-1 h-1 bg-white/10 rounded-full overflow-hidden w-24">
                        <div
                          className={`h-full ${c.barActive} rounded-full transition-all duration-75`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}

            {/* Pause/Play */}
            <button
              onClick={() => setPaused((p) => !p)}
              className="flex-shrink-0 mt-0 lg:mt-4 flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/50 hover:text-white/80 text-sm font-medium transition-all cursor-pointer whitespace-nowrap"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <i className={paused ? 'ri-play-fill' : 'ri-pause-fill'}></i>
              </div>
              <span className="hidden sm:inline">{paused ? 'Resume tour' : 'Pause'}</span>
            </button>
          </div>

          {/* ── Screen area ── */}
          <div
            className="relative"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {/* Browser chrome */}
            <div className="bg-slate-800 rounded-2xl overflow-hidden ring-1 ring-white/10">
              {/* Tab bar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-700/60 border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/60"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/60"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500/60"></div>
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="flex items-center gap-2 px-3 py-1 bg-slate-600/50 rounded-lg text-xs text-white/30 max-w-xs w-full">
                    <i className="ri-lock-line text-xs text-emerald-400"></i>
                    <span className="truncate">school.gosmartmis.rw</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${colors.badge}`}>
                    {step.badge}
                  </div>
                </div>
              </div>

              {/* Screen content */}
              <div className={`h-[420px] sm:h-[480px] transition-opacity duration-180 ${transitioning ? 'opacity-0' : 'opacity-100'}`}>
                <ScreenComponent />
              </div>
            </div>

            {/* Info card below screen */}
            <div className={`mt-4 p-5 bg-white/5 rounded-xl ring-1 ring-white/10 transition-opacity duration-180 ${transitioning ? 'opacity-0' : 'opacity-100'}`}>
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0 ${colors.bg}`}>
                  <i className={`${step.icon} text-white text-lg`}></i>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white mb-1">{step.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{step.description}</p>
                </div>
              </div>
            </div>

            {/* Step counter dots */}
            <div className="flex justify-center gap-2 mt-4">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { goTo(i); setPaused(true); }}
                  className={`transition-all duration-200 rounded-full cursor-pointer ${
                    i === activeStep ? `w-6 h-2 ${colors.barActive}` : 'w-2 h-2 bg-white/20 hover:bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-14 text-center">
          <p className="text-white/40 text-sm mb-5">Ready to see it live on your school?</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="https://demo.gosmartmis.rw"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold rounded-full hover:shadow-2xl hover:shadow-teal-500/30 hover:scale-105 transition-all whitespace-nowrap"
            >
              <i className="ri-rocket-line"></i>
              Try Free Demo
            </a>
            <a
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white/5 border border-white/15 text-white font-semibold rounded-full hover:bg-white/10 transition-all whitespace-nowrap"
            >
              <i className="ri-school-line"></i>
              Register Your School
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
