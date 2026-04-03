export const academicYears = [
  {
    id: 1,
    school_id: 'elite-school',
    year_name: '2024-2025',
    start_date: '2024-09-01',
    end_date: '2025-07-31',
    status: 'active',
    created_at: '2024-08-15'
  },
  {
    id: 2,
    school_id: 'elite-school',
    year_name: '2023-2024',
    start_date: '2023-09-01',
    end_date: '2024-07-31',
    status: 'archived',
    created_at: '2023-08-10'
  },
  {
    id: 3,
    school_id: 'elite-school',
    year_name: '2022-2023',
    start_date: '2022-09-01',
    end_date: '2023-07-31',
    status: 'archived',
    created_at: '2022-08-12'
  }
];

export const terms = [
  {
    id: 1,
    school_id: 'elite-school',
    academic_year_id: 1,
    term_name: 'Term 1',
    start_date: '2024-09-01',
    end_date: '2024-12-15',
    status: 'active',
    created_at: '2024-08-15'
  },
  {
    id: 2,
    school_id: 'elite-school',
    academic_year_id: 1,
    term_name: 'Term 2',
    start_date: '2025-01-06',
    end_date: '2025-04-10',
    status: 'upcoming',
    created_at: '2024-08-15'
  },
  {
    id: 3,
    school_id: 'elite-school',
    academic_year_id: 1,
    term_name: 'Term 3',
    start_date: '2025-04-21',
    end_date: '2025-07-31',
    status: 'upcoming',
    created_at: '2024-08-15'
  },
  {
    id: 4,
    school_id: 'elite-school',
    academic_year_id: 2,
    term_name: 'Term 1',
    start_date: '2023-09-01',
    end_date: '2023-12-15',
    status: 'completed',
    created_at: '2023-08-10'
  },
  {
    id: 5,
    school_id: 'elite-school',
    academic_year_id: 2,
    term_name: 'Term 2',
    start_date: '2024-01-08',
    end_date: '2024-04-12',
    status: 'completed',
    created_at: '2023-08-10'
  },
  {
    id: 6,
    school_id: 'elite-school',
    academic_year_id: 2,
    term_name: 'Term 3',
    start_date: '2024-04-22',
    end_date: '2024-07-31',
    status: 'completed',
    created_at: '2023-08-10'
  }
];

export const classes = [
  {
    id: 1,
    school_id: 'elite-school',
    class_name: 'P1A',
    level: 'Primary 1',
    capacity: 35,
    current_students: 32,
    class_teacher: 'Marie Uwase',
    class_teacher_id: 'teacher-001',
    room_number: 'Room 101',
    created_at: '2024-08-20'
  },
  {
    id: 2,
    school_id: 'elite-school',
    class_name: 'P1B',
    level: 'Primary 1',
    capacity: 35,
    current_students: 30,
    class_teacher: 'Jean Bosco',
    class_teacher_id: 'teacher-002',
    room_number: 'Room 102',
    created_at: '2024-08-20'
  },
  {
    id: 3,
    school_id: 'elite-school',
    class_name: 'P2A',
    level: 'Primary 2',
    capacity: 35,
    current_students: 33,
    class_teacher: 'Grace Mukamana',
    class_teacher_id: 'teacher-003',
    room_number: 'Room 201',
    created_at: '2024-08-20'
  },
  {
    id: 4,
    school_id: 'elite-school',
    class_name: 'P2B',
    level: 'Primary 2',
    capacity: 35,
    current_students: 31,
    class_teacher: 'Patrick Niyonzima',
    class_teacher_id: 'teacher-004',
    room_number: 'Room 202',
    created_at: '2024-08-20'
  },
  {
    id: 5,
    school_id: 'elite-school',
    class_name: 'P3A',
    level: 'Primary 3',
    capacity: 40,
    current_students: 38,
    class_teacher: 'Alice Umutoni',
    class_teacher_id: 'teacher-005',
    room_number: 'Room 301',
    created_at: '2024-08-20'
  },
  {
    id: 6,
    school_id: 'elite-school',
    class_name: 'P3B',
    level: 'Primary 3',
    capacity: 40,
    current_students: 36,
    class_teacher: 'David Habimana',
    class_teacher_id: 'teacher-006',
    room_number: 'Room 302',
    created_at: '2024-08-20'
  },
  {
    id: 7,
    school_id: 'elite-school',
    class_name: 'P4A',
    level: 'Primary 4',
    capacity: 40,
    current_students: 39,
    class_teacher: 'Sarah Ingabire',
    class_teacher_id: 'teacher-007',
    room_number: 'Room 401',
    created_at: '2024-08-20'
  },
  {
    id: 8,
    school_id: 'elite-school',
    class_name: 'P4B',
    level: 'Primary 4',
    capacity: 40,
    current_students: 37,
    class_teacher: 'Emmanuel Mugisha',
    class_teacher_id: 'teacher-008',
    room_number: 'Room 402',
    created_at: '2024-08-20'
  },
  {
    id: 9,
    school_id: 'elite-school',
    class_name: 'P5A',
    level: 'Primary 5',
    capacity: 40,
    current_students: 35,
    class_teacher: 'Claudine Uwera',
    class_teacher_id: 'teacher-009',
    room_number: 'Room 501',
    created_at: '2024-08-20'
  },
  {
    id: 10,
    school_id: 'elite-school',
    class_name: 'P5B',
    level: 'Primary 5',
    capacity: 40,
    current_students: 34,
    class_teacher: 'Eric Nsengimana',
    class_teacher_id: 'teacher-010',
    room_number: 'Room 502',
    created_at: '2024-08-20'
  },
  {
    id: 11,
    school_id: 'elite-school',
    class_name: 'P6A',
    level: 'Primary 6',
    capacity: 40,
    current_students: 38,
    class_teacher: 'Josephine Mukamazimpaka',
    class_teacher_id: 'teacher-011',
    room_number: 'Room 601',
    created_at: '2024-08-20'
  },
  {
    id: 12,
    school_id: 'elite-school',
    class_name: 'P6B',
    level: 'Primary 6',
    capacity: 40,
    current_students: 36,
    class_teacher: 'Robert Kayitare',
    class_teacher_id: 'teacher-012',
    room_number: 'Room 602',
    created_at: '2024-08-20'
  }
];

export const subjects = [
  {
    id: 1,
    school_id: 'elite-school',
    subject_name: 'Mathematics',
    subject_code: 'MATH',
    level: 'Primary 1',
    max_score: 20,
    pass_mark: 10,
    teacher_name: 'Marie Uwase',
    teacher_id: 'teacher-001',
    classes: ['P1A', 'P1B'],
    created_at: '2024-08-20'
  },
  {
    id: 2,
    school_id: 'elite-school',
    subject_name: 'English',
    subject_code: 'ENG',
    level: 'Primary 1',
    max_score: 20,
    pass_mark: 10,
    teacher_name: 'Jean Bosco',
    teacher_id: 'teacher-002',
    classes: ['P1A', 'P1B'],
    created_at: '2024-08-20'
  },
  {
    id: 3,
    school_id: 'elite-school',
    subject_name: 'Kinyarwanda',
    subject_code: 'KIN',
    level: 'Primary 1',
    max_score: 20,
    pass_mark: 10,
    teacher_name: 'Grace Mukamana',
    teacher_id: 'teacher-003',
    classes: ['P1A', 'P1B'],
    created_at: '2024-08-20'
  },
  {
    id: 4,
    school_id: 'elite-school',
    subject_name: 'Science',
    subject_code: 'SCI',
    level: 'Primary 1',
    max_score: 20,
    pass_mark: 10,
    teacher_name: 'Patrick Niyonzima',
    teacher_id: 'teacher-004',
    classes: ['P1A', 'P1B'],
    created_at: '2024-08-20'
  },
  {
    id: 5,
    school_id: 'elite-school',
    subject_name: 'Social Studies',
    subject_code: 'SST',
    level: 'Primary 1',
    max_score: 20,
    pass_mark: 10,
    teacher_name: 'Alice Umutoni',
    teacher_id: 'teacher-005',
    classes: ['P1A', 'P1B'],
    created_at: '2024-08-20'
  },
  {
    id: 6,
    school_id: 'elite-school',
    subject_name: 'Mathematics',
    subject_code: 'MATH',
    level: 'Primary 4',
    max_score: 20,
    pass_mark: 10,
    teacher_name: 'Sarah Ingabire',
    teacher_id: 'teacher-007',
    classes: ['P4A', 'P4B'],
    created_at: '2024-08-20'
  },
  {
    id: 7,
    school_id: 'elite-school',
    subject_name: 'English',
    subject_code: 'ENG',
    level: 'Primary 4',
    max_score: 20,
    pass_mark: 10,
    teacher_name: 'Emmanuel Mugisha',
    teacher_id: 'teacher-008',
    classes: ['P4A', 'P4B'],
    created_at: '2024-08-20'
  },
  {
    id: 8,
    school_id: 'elite-school',
    subject_name: 'Science',
    subject_code: 'SCI',
    level: 'Primary 4',
    max_score: 20,
    pass_mark: 10,
    teacher_name: 'David Habimana',
    teacher_id: 'teacher-006',
    classes: ['P4A', 'P4B'],
    created_at: '2024-08-20'
  },
  {
    id: 9,
    school_id: 'elite-school',
    subject_name: 'Social Studies',
    subject_code: 'SST',
    level: 'Primary 4',
    max_score: 20,
    pass_mark: 10,
    teacher_name: 'Claudine Uwera',
    teacher_id: 'teacher-009',
    classes: ['P4A', 'P4B'],
    created_at: '2024-08-20'
  },
  {
    id: 10,
    school_id: 'elite-school',
    subject_name: 'Mathematics',
    subject_code: 'MATH',
    level: 'Primary 6',
    max_score: 20,
    pass_mark: 10,
    teacher_name: 'Josephine Mukamazimpaka',
    teacher_id: 'teacher-011',
    classes: ['P6A', 'P6B'],
    created_at: '2024-08-20'
  },
  {
    id: 11,
    school_id: 'elite-school',
    subject_name: 'English',
    subject_code: 'ENG',
    level: 'Primary 6',
    max_score: 20,
    pass_mark: 10,
    teacher_name: 'Robert Kayitare',
    teacher_id: 'teacher-012',
    classes: ['P6A', 'P6B'],
    created_at: '2024-08-20'
  },
  {
    id: 12,
    school_id: 'elite-school',
    subject_name: 'Science',
    subject_code: 'SCI',
    level: 'Primary 6',
    max_score: 20,
    pass_mark: 10,
    teacher_name: 'Eric Nsengimana',
    teacher_id: 'teacher-010',
    classes: ['P6A', 'P6B'],
    created_at: '2024-08-20'
  }
];