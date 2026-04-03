import { ReportCardData } from '../types/report-card';

export const sampleReportCardData: ReportCardData = {
  schoolBranding: {
    logo: 'https://readdy.ai/api/search-image?query=modern%20professional%20school%20logo%20emblem%20with%20book%20and%20graduation%20cap%20simple%20clean%20design%20on%20white%20background%20educational%20institution%20branding&width=200&height=200&seq=school-logo-001&orientation=squarish',
    name: 'Elite Parents School',
    motto: 'Education for Excellence',
    address: 'P.O Box 123 Kigali, Rwanda',
    phone: '+250 788 123 456',
    academicYear: '2025-2026',
    term: 'Term 1'
  },
  studentInfo: {
    name: 'Jean Claude Mugisha',
    studentCode: 'EPS2025001',
    class: 'P4 A',
    academicYear: '2025-2026',
    term: 'Term 1'
  },
  subjects: [
    { subject: 'Mathematics', score: 16, maxScore: 20, percentage: 80 },
    { subject: 'English', score: 18, maxScore: 20, percentage: 90 },
    { subject: 'Kinyarwanda', score: 17, maxScore: 20, percentage: 85 },
    { subject: 'Science', score: 14, maxScore: 20, percentage: 70 },
    { subject: 'Social Studies', score: 15, maxScore: 20, percentage: 75 },
    { subject: 'Physical Education', score: 19, maxScore: 20, percentage: 95 },
    { subject: 'Arts & Crafts', score: 16, maxScore: 20, percentage: 80 },
    { subject: 'ICT', score: 17, maxScore: 20, percentage: 85 }
  ],
  totalScore: 132,
  maxTotalScore: 160,
  averageScore: 82.5,
  classRank: 5,
  totalStudents: 32,
  teacherComment: 'Jean Claude is a dedicated and hardworking student who consistently demonstrates excellent understanding of the curriculum. He actively participates in class discussions and shows strong leadership qualities. His performance in English and Physical Education is particularly commendable. However, he should focus more on improving his Science scores through additional practice and revision.',
  directorComment: 'Jean Claude has shown remarkable academic progress this term. His overall performance reflects his commitment to excellence. We encourage him to maintain this positive trajectory and continue striving for academic excellence. Keep up the good work!',
  decision: 'promoted',
  generatedDate: new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
};

export const sampleReportCardData2: ReportCardData = {
  schoolBranding: {
    logo: 'https://readdy.ai/api/search-image?query=modern%20professional%20school%20logo%20emblem%20with%20book%20and%20graduation%20cap%20simple%20clean%20design%20on%20white%20background%20educational%20institution%20branding&width=200&height=200&seq=school-logo-002&orientation=squarish',
    name: 'Future Bright Academy',
    motto: 'Building Tomorrow\'s Leaders',
    address: 'KG 15 Ave, Kigali, Rwanda',
    phone: '+250 788 987 654',
    academicYear: '2025-2026',
    term: 'Term 1'
  },
  studentInfo: {
    name: 'Marie Grace Uwase',
    studentCode: 'FBA2025045',
    class: 'P5 B',
    academicYear: '2025-2026',
    term: 'Term 1'
  },
  subjects: [
    { subject: 'Mathematics', score: 12, maxScore: 20, percentage: 60 },
    { subject: 'English', score: 14, maxScore: 20, percentage: 70 },
    { subject: 'Kinyarwanda', score: 16, maxScore: 20, percentage: 80 },
    { subject: 'Science', score: 11, maxScore: 20, percentage: 55 },
    { subject: 'Social Studies', score: 13, maxScore: 20, percentage: 65 },
    { subject: 'Physical Education', score: 17, maxScore: 20, percentage: 85 },
    { subject: 'Arts & Crafts', score: 15, maxScore: 20, percentage: 75 },
    { subject: 'ICT', score: 12, maxScore: 20, percentage: 60 }
  ],
  totalScore: 110,
  maxTotalScore: 160,
  averageScore: 68.75,
  classRank: 18,
  totalStudents: 28,
  teacherComment: 'Marie Grace shows good effort in class but needs to improve her performance in Mathematics and Science. She should dedicate more time to homework and seek additional help when needed. Her performance in Kinyarwanda and Physical Education is satisfactory. With consistent effort and focus, she can achieve better results.',
  directorComment: 'Marie Grace has potential but must work harder to improve her academic performance. We recommend additional tutoring in Mathematics and Science. Parents are encouraged to monitor homework completion and provide a conducive study environment at home.',
  decision: 'conditional',
  generatedDate: new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
};

export const reportCards = [
  {
    studentName: 'Jean Claude Mugisha',
    studentCode: 'EPS2025001',
    class: 'P4A',
    averageScore: 82.5,
    rank: '5 / 32',
    isApproved: true,
    feesBalance: 0
  },
  {
    studentName: 'Marie Grace Uwase',
    studentCode: 'FBA2025045',
    class: 'P5B',
    averageScore: 68.75,
    rank: '18 / 28',
    isApproved: true,
    feesBalance: 45000
  },
  {
    studentName: 'Kevin Niyonzima',
    studentCode: 'EPS2025012',
    class: 'P5A',
    averageScore: 74.0,
    rank: '9 / 30',
    isApproved: true,
    feesBalance: 0
  },
  {
    studentName: 'Alice Mukamana',
    studentCode: 'EPS2025023',
    class: 'P3A',
    averageScore: 61.5,
    rank: '21 / 29',
    isApproved: false,
    feesBalance: 30000
  },
  {
    studentName: 'David Habimana',
    studentCode: 'EPS2025034',
    class: 'P6A',
    averageScore: 88.0,
    rank: '2 / 30',
    isApproved: true,
    feesBalance: 0
  },
  {
    studentName: 'Grace Ishimwe',
    studentCode: 'EPS2025056',
    class: 'P2A',
    averageScore: 77.25,
    rank: '7 / 32',
    isApproved: true,
    feesBalance: 0
  },
  {
    studentName: 'Patrick Uwimana',
    studentCode: 'EPS2025067',
    class: 'P1A',
    averageScore: 55.0,
    rank: '24 / 28',
    isApproved: false,
    feesBalance: 60000
  },
  {
    studentName: 'Diane Ingabire',
    studentCode: 'EPS2025078',
    class: 'P4A',
    averageScore: 91.5,
    rank: '1 / 32',
    isApproved: true,
    feesBalance: 0
  },
  {
    studentName: 'Samuel Nkurunziza',
    studentCode: 'EPS2025089',
    class: 'P3A',
    averageScore: 70.0,
    rank: '12 / 29',
    isApproved: true,
    feesBalance: 15000
  },
  {
    studentName: 'Claudine Umubyeyi',
    studentCode: 'EPS2025090',
    class: 'P6A',
    averageScore: 83.75,
    rank: '4 / 30',
    isApproved: true,
    feesBalance: 0
  }
];