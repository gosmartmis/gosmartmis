import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'ai';
  text: string;
  code?: string;
  fixes?: string[];
  timestamp: Date;
}

// ─────────────────────────────────────────────────────────────────
// Go Smart AI Engine — 35+ error patterns
// ─────────────────────────────────────────────────────────────────
function analyzeError(input: string): { text: string; code?: string; fixes?: string[] } {
  const i = input.toLowerCase();

  // ── REPORT CARDS ─────────────────────────────────────────────
  if (i.includes('report card') && (i.includes('lock') || i.includes('blocked') || i.includes('can\'t view') || i.includes('cannot view') || i.includes('access denied'))) {
    return {
      text: 'Report card is locked for this student. This happens when the student has an outstanding fee balance. The accountant controls the lock.',
      fixes: [
        'Go to Accountant dashboard → Fee Management and check if the student has an outstanding balance.',
        'Record a payment for the student to clear the balance.',
        'Alternatively, the accountant can manually unlock the report card from Fee Management.',
        'Check the fee_records table: verify a record exists for this student and the current term.',
        'If the balance is zero but still locked, check the report_cards table — the is_locked column may have a stale true value.',
      ],
      code: `-- Check why report card is locked\nSELECT r.id, r.is_locked, r.student_id,\n       f.balance, f.term_id\nFROM report_cards r\nLEFT JOIN fee_records f ON f.student_id = r.student_id\nWHERE r.student_id = 'your-student-uuid'\nORDER BY r.created_at DESC;\n\n-- Manually unlock (use with care)\nUPDATE report_cards\nSET is_locked = false\nWHERE student_id = 'your-student-uuid';`,
    };
  }

  if (i.includes('report card') && (i.includes('not published') || i.includes('not showing') || i.includes('pending') || i.includes('approval'))) {
    return {
      text: 'Report card exists but hasn\'t been published yet. There are two approval gates: Dean approval → Director final approval.',
      fixes: [
        'Step 1 — Check if the Dean has approved the marks: Dean dashboard → Marks Approval.',
        'Step 2 — After Dean approval, the Director must give Final Approval: Director dashboard → Final Approval.',
        'Check the report_cards table: look at the status column — it should be "published" for students to see it.',
        'If status is "draft", marks may not have been submitted by the teacher yet.',
        'If status is "dean_approved" it\'s waiting for Director final approval.',
      ],
      code: `-- Check report card approval status for all students\nSELECT r.id, r.status, r.student_id,\n       p.full_name AS student_name,\n       r.term_id, r.created_at\nFROM report_cards r\nJOIN profiles p ON p.id = r.student_id\nWHERE r.status != 'published'\nORDER BY r.created_at DESC;`,
    };
  }

  if (i.includes('report card') && (i.includes('generat') || i.includes('missing marks') || i.includes('incomplete'))) {
    return {
      text: 'Report card generation failed or shows incomplete marks. Not all subjects have marks entered for this student.',
      fixes: [
        'Check marks table: verify all teacher_assignments for the student\'s class have corresponding mark entries.',
        'Each subject needs marks for the current term — query marks table filtered by class_id and term_id.',
        'Teacher may have forgotten to submit marks — check useTeacherMarksStats for pending submissions.',
        'Marks must be in "submitted" or "approved" status — draft marks won\'t appear on report cards.',
        'Verify the student has a valid class_id in the students table.',
      ],
      code: `-- Find missing marks for a class in a term\nSELECT ta.subject_id, s.name AS subject,\n       COUNT(m.id) AS marks_entered,\n       COUNT(st.id) AS students_in_class\nFROM teacher_assignments ta\nJOIN subjects s ON s.id = ta.subject_id\nLEFT JOIN marks m ON m.subject_id = ta.subject_id\n  AND m.term_id = 'your-term-uuid'\nJOIN students st ON st.class_id = ta.class_id\nWHERE ta.class_id = 'your-class-uuid'\nGROUP BY ta.subject_id, s.name\nHAVING COUNT(m.id) < COUNT(st.id);`,
    };
  }

  // ── ATTENDANCE ────────────────────────────────────────────────
  if (i.includes('attendance') && (i.includes('duplicate') || i.includes('already taken') || i.includes('already exist') || i.includes('unique'))) {
    return {
      text: 'Duplicate attendance record. The teacher is trying to take attendance for a class/date combination that already has records.',
      fixes: [
        'The attendance table has a unique constraint on (student_id, date) — you can\'t insert twice for the same day.',
        'Use UPSERT instead of INSERT: supabase.from("attendance").upsert([...], { onConflict: "student_id,date" }).',
        'Check if attendance was partially saved — query the attendance table for that date and class.',
        'If the teacher needs to correct attendance, update existing records instead of inserting new ones.',
      ],
      code: `// ❌ Fails if attendance already exists for the date\nawait supabase.from('attendance').insert(records);\n\n// ✅ Upsert — updates if exists, inserts if not\nawait supabase.from('attendance')\n  .upsert(records, { onConflict: 'student_id,date' });\n\n-- Check existing attendance for a date\nSELECT a.*, p.full_name\nFROM attendance a\nJOIN profiles p ON p.id = a.student_id\nWHERE a.date = '2025-03-27'\nAND a.class_id = 'your-class-uuid';`,
    };
  }

  if (i.includes('attendance') && (i.includes('not showing') || i.includes('empty') || i.includes('no student') || i.includes('no class'))) {
    return {
      text: 'Attendance page shows no students or no classes. The teacher likely has no class assignments in the system.',
      fixes: [
        'Check teacher_assignments table — the teacher must have at least one row linking them to a class.',
        'The useTeacherAssignments hook reads from teacher_assignments filtered by teacher_id (profile id).',
        'Verify the teacher\'s profile.id matches the teacher_id in teacher_assignments.',
        'If assignments exist, check that the class_id links to a valid class in the classes table.',
        'Run the seed query below to add a test assignment if in development.',
      ],
      code: `-- Check teacher assignments\nSELECT ta.*, c.name AS class_name, s.name AS subject_name\nFROM teacher_assignments ta\nJOIN classes c ON c.id = ta.class_id\nJOIN subjects s ON s.id = ta.subject_id\nWHERE ta.teacher_id = 'your-teacher-profile-uuid';\n\n-- Fix: insert a missing assignment\nINSERT INTO teacher_assignments (teacher_id, class_id, subject_id, school_id, academic_year_id)\nVALUES ('teacher-uuid', 'class-uuid', 'subject-uuid', 'school-uuid', 'year-uuid');`,
    };
  }

  if (i.includes('attendance') && (i.includes('date') || i.includes('wrong day') || i.includes('future') || i.includes('past'))) {
    return {
      text: 'Attendance date issue — records being saved with wrong dates or blocked for future dates.',
      fixes: [
        'Always use new Date().toISOString().split("T")[0] to get today\'s date in YYYY-MM-DD format.',
        'Attendance should not be allowed for future dates — add a date validation check.',
        'Check for timezone mismatches: the server may be UTC while the browser is UTC+2 (Kigali).',
        'Use date-fns or a simple string comparison to prevent future-date submissions.',
      ],
      code: `// Get today's date in the correct format\nconst today = new Date().toISOString().split('T')[0]; // "2025-03-27"\n\n// Prevent future dates\nconst selectedDate = new Date(dateInput);\nconst now = new Date();\nif (selectedDate > now) {\n  alert('Cannot take attendance for future dates');\n  return;\n}\n\n// Handle Rwanda timezone (UTC+2)\nconst rwandaDate = new Intl.DateTimeFormat('en-CA', {\n  timeZone: 'Africa/Kigali'\n}).format(new Date()); // "2025-03-27"`,
    };
  }

  // ── TIMETABLE ─────────────────────────────────────────────────
  if (i.includes('timetable') && (i.includes('not showing') || i.includes('empty') || i.includes('blank') || i.includes('no schedule'))) {
    return {
      text: 'Timetable page is empty. No published timetable entries exist for this teacher\'s assignments.',
      fixes: [
        'Check the timetables table — entries must exist AND have status = "published" to show.',
        'Entries are linked to teacher via teacher_assignments.id — verify the teacher has assignments first.',
        'The useTimetable / useTeacherTimetable hook filters by teacher_assignment_id, not teacher_id directly.',
        'Admin must create timetable entries in the Admin/Dean Timetable Management page and set them to published.',
        'Seed some test entries with the SQL below to verify the page renders correctly.',
      ],
      code: `-- Check timetable entries for a teacher\nSELECT t.*, ta.teacher_id, c.name AS class_name, s.name AS subject_name\nFROM timetables t\nJOIN teacher_assignments ta ON ta.id = t.teacher_assignment_id\nJOIN classes c ON c.id = ta.class_id\nJOIN subjects s ON s.id = ta.subject_id\nWHERE ta.teacher_id = 'your-teacher-uuid'\nAND t.status = 'published';\n\n-- Quick fix: publish all draft entries\nUPDATE timetables\nSET status = 'published'\nWHERE status = 'draft'\nAND teacher_assignment_id IN (\n  SELECT id FROM teacher_assignments WHERE teacher_id = 'your-teacher-uuid'\n);`,
    };
  }

  if (i.includes('timetable') && (i.includes('conflict') || i.includes('overlap') || i.includes('same time') || i.includes('double booked'))) {
    return {
      text: 'Timetable conflict — a teacher or classroom is scheduled for two different classes at the same time slot.',
      fixes: [
        'Query for overlapping entries using the same day + period combination.',
        'Add a unique constraint: ALTER TABLE timetables ADD CONSTRAINT no_teacher_double_book UNIQUE (teacher_assignment_id, day_of_week, period_number).',
        'In the timetable UI, check existing slots before saving a new entry.',
        'If a class and room are double-booked, add room_id as part of the conflict check.',
      ],
      code: `-- Find all timetable conflicts for a teacher\nSELECT\n  t1.id AS entry1,\n  t2.id AS entry2,\n  t1.day_of_week,\n  t1.period_number,\n  c1.name AS class1,\n  c2.name AS class2\nFROM timetables t1\nJOIN timetables t2\n  ON t1.day_of_week = t2.day_of_week\n  AND t1.period_number = t2.period_number\n  AND t1.id != t2.id\nJOIN teacher_assignments ta1 ON ta1.id = t1.teacher_assignment_id\nJOIN teacher_assignments ta2 ON ta2.id = t2.teacher_assignment_id\nJOIN classes c1 ON c1.id = ta1.class_id\nJOIN classes c2 ON c2.id = ta2.class_id\nWHERE ta1.teacher_id = ta2.teacher_id;\n\n-- Add unique constraint to prevent future conflicts\nALTER TABLE timetables\nADD CONSTRAINT unique_teacher_slot\nUNIQUE (teacher_assignment_id, day_of_week, period_number);`,
    };
  }

  // ── MARKS & GRADING ───────────────────────────────────────────
  if (i.includes('marks') && (i.includes('not submit') || i.includes('can\'t submit') || i.includes('blocked') || i.includes('window closed'))) {
    return {
      text: 'Teacher can\'t submit marks. The marks entry window may be closed, the term may not be active, or the marks are in wrong status.',
      fixes: [
        'Check if a term is currently active: terms table, look for is_active = true.',
        'Marks entry is controlled by the active term — no active term = no marks submission.',
        'Check the marks table: if marks already exist with status "submitted" or "approved", they can\'t be re-edited.',
        'Dean/Director can re-open marks by setting status back to "draft" if correction is needed.',
        'Ensure the teacher has a valid teacher_assignment for the class+subject combination.',
      ],
      code: `-- Check active term\nSELECT * FROM terms WHERE is_active = true;\n\n-- Check existing marks status for a teacher\nSELECT m.status, COUNT(*) AS count\nFROM marks m\nJOIN teacher_assignments ta ON ta.id = m.teacher_assignment_id\nWHERE ta.teacher_id = 'your-teacher-uuid'\nGROUP BY m.status;\n\n-- Re-open marks for correction (Dean/Director only)\nUPDATE marks\nSET status = 'draft'\nWHERE teacher_assignment_id = 'assignment-uuid'\nAND term_id = 'term-uuid';`,
    };
  }

  if (i.includes('marks') && (i.includes('out of range') || i.includes('invalid') || i.includes('exceeds') || i.includes('max score'))) {
    return {
      text: 'Marks validation error — a score exceeds the maximum allowed value or is negative.',
      fixes: [
        'Check the max_score column in the marks or teacher_assignments table for the subject.',
        'Add frontend validation: score must be between 0 and max_score before saving.',
        'Check if a DB constraint exists: marks should have a CHECK(score >= 0 AND score <= max_score).',
        'The default max score is typically 100 — verify this matches expectations.',
      ],
      code: `-- Add DB-level validation for marks\nALTER TABLE marks\nADD CONSTRAINT valid_score\nCHECK (score >= 0 AND score <= 100);\n\n// Frontend validation before saving\nfunction validateMark(score: number, maxScore = 100): boolean {\n  if (isNaN(score)) return false;\n  if (score < 0 || score > maxScore) return false;\n  return true;\n}\n\nif (!validateMark(score)) {\n  setError(\`Score must be between 0 and \${maxScore}\`);\n  return;\n}`,
    };
  }

  if (i.includes('marks approval') || (i.includes('dean') && i.includes('approv'))) {
    return {
      text: 'Dean marks approval issue — marks submitted by teachers are waiting for Dean review, or the approval flow is stuck.',
      fixes: [
        'Dean dashboard → Marks Approval: check for pending submissions listed there.',
        'Marks must have status "submitted" to appear in Dean\'s approval queue.',
        'After Dean approval, status changes to "dean_approved" — then Director sees it in Final Approval.',
        'If marks don\'t appear in the Dean\'s queue, check if the teacher correctly clicked "Submit" (not just saved).',
        'Check the marks table: status should be "submitted" for pending items.',
      ],
      code: `-- See all marks pending Dean approval\nSELECT m.id, m.status, m.score,\n       p_teacher.full_name AS teacher,\n       p_student.full_name AS student,\n       s.name AS subject, t.name AS term\nFROM marks m\nJOIN teacher_assignments ta ON ta.id = m.teacher_assignment_id\nJOIN profiles p_teacher ON p_teacher.id = ta.teacher_id\nJOIN students st ON st.id = m.student_id\nJOIN profiles p_student ON p_student.id = st.profile_id\nJOIN subjects s ON s.id = ta.subject_id\nJOIN terms t ON t.id = m.term_id\nWHERE m.status = 'submitted'\nORDER BY m.updated_at DESC;`,
    };
  }

  // ── STUDENT / ENROLLMENT ──────────────────────────────────────
  if (i.includes('student') && (i.includes('not showing') || i.includes('missing') || i.includes('dashboard empty') || i.includes('no data'))) {
    return {
      text: 'Student dashboard is empty or student data isn\'t loading. The student\'s profile may not be properly linked to a student record.',
      fixes: [
        'A student user needs both a profiles row AND a students row. Check both tables.',
        'The students table has a profile_id (or user_id) column linking it to profiles.id.',
        'If the student record exists but profile_id is wrong/null, update it.',
        'The student\'s class_id must point to a valid class in the classes table.',
        'Check the useStudentDashboard hook — it joins students with profiles using the auth user\'s ID.',
      ],
      code: `-- Diagnose a student's data linkage\nSELECT\n  p.id AS profile_id,\n  p.full_name, p.role,\n  st.id AS student_id,\n  st.class_id,\n  c.name AS class_name\nFROM profiles p\nLEFT JOIN students st ON st.profile_id = p.id\nLEFT JOIN classes c ON c.id = st.class_id\nWHERE p.email = 'student@example.com';\n\n-- Fix: link an existing student record to a profile\nUPDATE students\nSET profile_id = 'profile-uuid'\nWHERE id = 'student-uuid';`,
    };
  }

  if (i.includes('promotion') || i.includes('student promot') || i.includes('next class') || i.includes('advance')) {
    return {
      text: 'Student promotion issue — students aren\'t being promoted to the next class, or promotion is failing.',
      fixes: [
        'Promotion reads from student_promotions table — check if a promotion record exists for the student.',
        'Promotion requires end-of-year marks and a passing average — verify all marks are submitted and approved.',
        'The promotion engine (promotionEngine.ts) calculates averages and creates student_promotions records.',
        'Verify the academic year has an end date set — promotion triggers at year end.',
        'After promotion, students\' class_id in the students table must be updated to the new class.',
      ],
      code: `-- Check promotion status for all students\nSELECT sp.*, p.full_name AS student_name,\n       c_from.name AS from_class,\n       c_to.name AS to_class,\n       sp.status, sp.average_score\nFROM student_promotions sp\nJOIN students st ON st.id = sp.student_id\nJOIN profiles p ON p.id = st.profile_id\nJOIN classes c_from ON c_from.id = sp.from_class_id\nLEFT JOIN classes c_to ON c_to.id = sp.to_class_id\nORDER BY sp.created_at DESC;\n\n-- Apply promotion (update student's class)\nUPDATE students\nSET class_id = sp.to_class_id\nFROM student_promotions sp\nWHERE students.id = sp.student_id\nAND sp.status = 'approved';`,
    };
  }

  // ── FEES & PAYMENTS ───────────────────────────────────────────
  if (i.includes('fee') && (i.includes('not showing') || i.includes('missing') || i.includes('no record') || i.includes('balance'))) {
    return {
      text: 'Fee records not showing or balance incorrect for a student.',
      fixes: [
        'Fee records are created per-student per-term in fee_records table — check if one exists.',
        'If no fee record exists, the accountant needs to create it: Accountant → Fee Management → Add Record.',
        'Balance = total_fee - amount_paid — verify both columns are correctly set.',
        'The FeeAlertBanner on the student dashboard reads from fee_records filtered by student_id and term_id.',
        'Check if the active term matches the term_id on the fee record.',
      ],
      code: `-- Check fee records for a student\nSELECT fr.*, t.name AS term_name, fr.total_fee, fr.amount_paid,\n       (fr.total_fee - fr.amount_paid) AS balance\nFROM fee_records fr\nJOIN terms t ON t.id = fr.term_id\nWHERE fr.student_id = 'your-student-uuid'\nORDER BY fr.created_at DESC;\n\n-- Create a fee record if missing\nINSERT INTO fee_records (student_id, term_id, total_fee, amount_paid, school_id)\nVALUES ('student-uuid', 'term-uuid', 150000, 0, 'school-uuid');`,
    };
  }

  if (i.includes('payment') && (i.includes('not record') || i.includes('duplicate') || i.includes('wrong amount') || i.includes('fail'))) {
    return {
      text: 'Fee payment recording issue — payment not saved, duplicated, or incorrect amount.',
      fixes: [
        'Check fee_payments table — each payment should have a unique reference_number.',
        'After a payment is recorded, the fee_records.amount_paid should be incremented.',
        'If amount_paid wasn\'t updated after payment, run the fix query below.',
        'Duplicate payments: add a unique constraint on reference_number to prevent re-submission.',
        'Check if the payment was recorded against the correct term — wrong term_id is a common mistake.',
      ],
      code: `-- Reconcile: update amount_paid based on actual payments\nUPDATE fee_records fr\nSET amount_paid = (\n  SELECT COALESCE(SUM(fp.amount), 0)\n  FROM fee_payments fp\n  WHERE fp.student_id = fr.student_id\n  AND fp.term_id = fr.term_id\n  AND fp.status = 'completed'\n)\nWHERE fr.student_id = 'student-uuid';\n\n-- Check for duplicate payments\nSELECT reference_number, COUNT(*) AS duplicates\nFROM fee_payments\nGROUP BY reference_number\nHAVING COUNT(*) > 1;`,
    };
  }

  // ── HOLIDAY PACKAGES ──────────────────────────────────────────
  if (i.includes('holiday') && (i.includes('package') || i.includes('assignment'))) {
    return {
      text: 'Holiday packages not visible to students, or teacher can\'t create/manage packages.',
      fixes: [
        'Student sees packages filtered by their class_id — verify the student\'s class_id in the students table.',
        'Teacher creates packages linked to a class_id — check holiday_packages.class_id matches the student\'s class.',
        'RLS policy on holiday_packages must allow students to SELECT where class_id matches their class.',
        'If the teacher can\'t create packages, verify they have a teacher_assignment for that class.',
        'Check the attachment URL — must be a valid shareable link (Google Drive / OneDrive).',
      ],
      code: `-- Check packages visible to a student's class\nSELECT hp.*, c.name AS class_name, s.name AS subject_name\nFROM holiday_packages hp\nJOIN classes c ON c.id = hp.class_id\nJOIN subjects s ON s.id = hp.subject_id\nWHERE hp.class_id = (\n  SELECT class_id FROM students WHERE profile_id = 'student-profile-uuid'\n);\n\n-- Fix: ensure student has a class_id set\nSELECT st.class_id, c.name\nFROM students st\nLEFT JOIN classes c ON c.id = st.class_id\nWHERE st.profile_id = 'student-profile-uuid';`,
    };
  }

  // ── LOGIN / AUTH ──────────────────────────────────────────────
  if (i.includes('login') && (i.includes('fail') || i.includes('invalid') || i.includes('wrong password') || i.includes('can\'t login') || i.includes('cannot login'))) {
    return {
      text: 'Login failure in Go Smart. This can be a wrong password, orphaned auth account, inactive profile, or wrong role redirect.',
      fixes: [
        'Verify the user exists in Supabase Auth AND has a matching row in the profiles table.',
        'Check profiles.is_active — if false, the login flow throws "account deactivated".',
        'Check the user\'s role in profiles — wrong role means they\'ll be redirected to the wrong dashboard.',
        'Use Supabase Dashboard → Authentication → Users to reset the password if needed.',
        'If auth account exists but no profiles row, the login will always fail — add a profile row.',
      ],
      code: `-- Check user profile status\nSELECT id, email, full_name, role, is_active, school_id\nFROM profiles\nWHERE email = 'user@gosmartmis.com';\n\n-- Fix: reactivate an account\nUPDATE profiles\nSET is_active = true\nWHERE email = 'user@gosmartmis.com';\n\n-- Fix: correct a wrong role\nUPDATE profiles\nSET role = 'teacher' -- or director, dean, registrar, accountant, student\nWHERE email = 'user@gosmartmis.com';`,
    };
  }

  if (i.includes('role') && (i.includes('wrong') || i.includes('redirect') || i.includes('wrong dashboard') || i.includes('wrong page'))) {
    return {
      text: 'User is landing on the wrong dashboard after login. The role in the profiles table doesn\'t match where they should go.',
      fixes: [
        'The login redirect is determined by profiles.role — check its value.',
        'Valid roles: super_admin, director, school_manager, dean, registrar, accountant, teacher, student.',
        'The SmartIndex.tsx router uses the role to redirect to the correct dashboard path.',
        'If role is null or misspelled, the router will hit the default case and redirect incorrectly.',
        'Fix the role in the profiles table and have the user log in again.',
      ],
      code: `-- Check and fix user role\nSELECT id, email, role FROM profiles WHERE email = 'user@example.com';\n\n-- Valid roles\nUPDATE profiles\nSET role = 'teacher' -- super_admin | director | school_manager | dean | registrar | accountant | teacher | student\nWHERE email = 'user@example.com';\n\n// Role-to-route mapping in SmartIndex.tsx\nconst ROLE_ROUTES: Record<string, string> = {\n  super_admin: '/super-admin',\n  director: '/director',\n  school_manager: '/school-manager',\n  dean: '/dean',\n  registrar: '/registrar',\n  accountant: '/accountant',\n  teacher: '/teacher',\n  student: '/student',\n};`,
    };
  }

  // ── SCHOOL / SUBSCRIPTION ─────────────────────────────────────
  if (i.includes('subscription') && (i.includes('expir') || i.includes('suspend') || i.includes('access') || i.includes('school blocked'))) {
    return {
      text: 'School subscription has expired or is suspended. The school can\'t access the system.',
      fixes: [
        'Super Admin → Subscriptions → find the school and check its status.',
        'Extend the subscription end_date or change status from "suspended" to "active".',
        'Check school_payments table for the latest payment record.',
        'The ProtectedRoute or TenantContext may check subscription status — a suspended school should be redirected.',
        'If in demo mode, check if the trial period (default 30 days) has ended.',
      ],
      code: `-- Check school subscription status\nSELECT s.id, s.name, s.status, s.subscription_end_date,\n       s.plan_type, s.trial_ends_at\nFROM schools s\nWHERE s.id = 'your-school-uuid';\n\n-- Extend subscription\nUPDATE schools\nSET subscription_end_date = NOW() + INTERVAL '1 year',\n    status = 'active'\nWHERE id = 'your-school-uuid';\n\n-- Record a renewal payment\nINSERT INTO school_payments (school_id, amount, payment_date, status, plan_type)\nVALUES ('school-uuid', 230000, NOW(), 'completed', 'primary');`,
    };
  }

  if (i.includes('onboard') || (i.includes('new school') && (i.includes('setup') || i.includes('creat') || i.includes('fail')))) {
    return {
      text: 'School onboarding failed or incomplete. The onboard-school Edge Function may have errored, or required data is missing.',
      fixes: [
        'Check the onboard-school Edge Function logs in Supabase Dashboard → Edge Functions.',
        'The function creates: school record, director profile, auth user, and initial settings.',
        'If it partially completed, some records may exist while others don\'t — check schools and profiles tables.',
        'Verify the SUPABASE_SERVICE_ROLE_KEY secret is set on the edge function.',
        'Re-run onboarding by calling the edge function again with the same school data — add idempotency handling.',
      ],
      code: `-- Check if school was partially created\nSELECT s.id, s.name, s.status,\n       COUNT(p.id) AS profile_count\nFROM schools s\nLEFT JOIN profiles p ON p.school_id = s.id\nWHERE s.name ILIKE '%school name%'\nGROUP BY s.id, s.name, s.status;\n\n-- Find orphaned schools with no director\nSELECT s.id, s.name\nFROM schools s\nWHERE NOT EXISTS (\n  SELECT 1 FROM profiles p\n  WHERE p.school_id = s.id\n  AND p.role = 'director'\n);`,
    };
  }

  // ── ACADEMIC YEAR / TERM ──────────────────────────────────────
  if (i.includes('academic year') || (i.includes('term') && (i.includes('not active') || i.includes('no term') || i.includes('missing term')))) {
    return {
      text: 'No active academic year or term. Many features (marks, attendance, report cards) require an active term.',
      fixes: [
        'Director → Academic Management or Term Management: ensure an academic year exists with at least one active term.',
        'Only one term should be active at a time — check for multiple active terms.',
        'The is_active flag on terms controls what\'s available to teachers and students.',
        'If switching terms, deactivate the old one first, then activate the new one.',
        'Academic years must also be active — check academic_years.is_active.',
      ],
      code: `-- Check active academic year and term\nSELECT ay.name AS year, ay.is_active AS year_active,\n       t.name AS term, t.is_active AS term_active,\n       t.start_date, t.end_date\nFROM academic_years ay\nJOIN terms t ON t.academic_year_id = ay.id\nWHERE ay.school_id = 'your-school-uuid'\nORDER BY ay.start_date DESC, t.start_date;\n\n-- Fix: activate the correct term\nUPDATE terms SET is_active = false WHERE school_id = 'school-uuid';\nUPDATE terms SET is_active = true WHERE id = 'correct-term-uuid';`,
    };
  }

  // ── NOTIFICATIONS / SMS / EMAIL ───────────────────────────────
  if (i.includes('sms') && (i.includes('not sending') || i.includes('fail') || i.includes('not work') || i.includes('twilio'))) {
    return {
      text: 'SMS notifications not sending. The send-sms Edge Function relies on Twilio credentials in Supabase secrets.',
      fixes: [
        'Go to Supabase → Edge Functions → send-sms → Secrets, and verify TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER are set.',
        'Test the function from the Edge Function Tester tab with a POST request.',
        'Check notification_logs table for rows with status="failed" — the error_message column will explain.',
        'Phone numbers must be in international format: +250788123456 (not 0788123456).',
        'Ensure the school has SMS enabled: check email_settings or sms_settings table.',
      ],
      code: `// send-sms Edge Function secrets needed:\n// TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx\n// TWILIO_AUTH_TOKEN=your_auth_token  \n// TWILIO_PHONE_NUMBER=+1234567890\n\n-- Check SMS failure logs\nSELECT * FROM notification_logs\nWHERE status = 'failed'\nAND notification_type = 'sms'\nORDER BY created_at DESC\nLIMIT 20;\n\n-- Check if SMS is enabled for the school\nSELECT * FROM sms_settings WHERE school_id = 'your-school-uuid';`,
    };
  }

  if (i.includes('email') && (i.includes('not sending') || i.includes('fail') || i.includes('smtp') || i.includes('not work'))) {
    return {
      text: 'Email notifications not sending. The send-email Edge Function needs SMTP credentials configured.',
      fixes: [
        'Go to Supabase → Edge Functions → send-email → Secrets, verify SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.',
        'Common SMTP providers: Gmail (smtp.gmail.com:587), Mailgun, SendGrid.',
        'For Gmail, you must use an App Password (not your regular password) if 2FA is enabled.',
        'Check notification_logs for failed email logs to see the exact error message.',
        'Verify the from address in email_settings matches an authorized sender on your SMTP provider.',
      ],
      code: `// send-email Edge Function secrets needed:\n// SMTP_HOST=smtp.gmail.com\n// SMTP_PORT=587\n// SMTP_USER=noreply@yourschool.rw\n// SMTP_PASS=your_app_password\n// FROM_NAME=Go Smart Academy\n\n-- Check email settings\nSELECT * FROM email_settings WHERE school_id = 'your-school-uuid';\n\n-- Check recent email failures\nSELECT error_message, recipient, created_at\nFROM notification_logs\nWHERE status = 'failed' AND notification_type = 'email'\nORDER BY created_at DESC LIMIT 10;`,
    };
  }

  // ── CSV IMPORT ────────────────────────────────────────────────
  if (i.includes('csv') && (i.includes('import') || i.includes('fail') || i.includes('error') || i.includes('wrong'))) {
    return {
      text: 'CSV import failing for teacher or student bulk upload.',
      fixes: [
        'Check the expected column headers — they must match exactly (case-sensitive).',
        'For teachers CSV: full_name, email, phone, subject are required columns.',
        'For students CSV: full_name, class_name, date_of_birth are required.',
        'Ensure no BOM (byte order mark) at the start of the CSV — save as UTF-8 without BOM.',
        'Check the bulk-import-teachers Edge Function logs for detailed row-level errors.',
        'Empty rows or rows with missing required fields will cause the entire batch to fail if not handled.',
      ],
      code: `// Expected teacher CSV format:\n// full_name,email,phone,subject,gender\n// "Grace Uwimana","grace@school.rw","+250788123456","Mathematics","Female"\n\n// Expected student CSV format:\n// full_name,email,class_name,date_of_birth,gender,parent_phone\n// "Kevin Mugisha","kevin@school.rw","S2 A","2010-05-15","Male","+250788000001"\n\n-- Check for imported teachers/students\nSELECT full_name, email, created_at\nFROM profiles\nWHERE school_id = 'your-school-uuid'\nAND created_at > NOW() - INTERVAL '1 hour'\nORDER BY created_at DESC;`,
    };
  }

  // ── RISK ALERTS ───────────────────────────────────────────────
  if (i.includes('risk') && (i.includes('alert') || i.includes('not showing') || i.includes('empty') || i.includes('at risk'))) {
    return {
      text: 'Student risk alerts not showing in Dean/Director dashboard.',
      fixes: [
        'Risk alerts are generated from mark_alerts table — check if rows exist there.',
        'The risk engine calculates risk based on marks below a threshold (usually 50%).',
        'If marks haven\'t been submitted yet for the current term, no risks can be calculated.',
        'Check useRealRiskAlerts hook — it queries mark_alerts table filtered by school_id.',
        'Run the risk calculation manually by triggering the analytics engine.',
      ],
      code: `-- Check risk alerts in the DB\nSELECT ma.*, p.full_name AS student_name,\n       s.name AS subject_name, c.name AS class_name\nFROM mark_alerts ma\nJOIN students st ON st.id = ma.student_id\nJOIN profiles p ON p.id = st.profile_id\nJOIN subjects s ON s.id = ma.subject_id\nJOIN classes c ON c.id = st.class_id\nWHERE ma.school_id = 'your-school-uuid'\nAND ma.alert_type = 'low_performance'\nORDER BY ma.created_at DESC;\n\n-- Manual risk insert for testing\nINSERT INTO mark_alerts (student_id, subject_id, school_id, alert_type, score, threshold)\nVALUES ('student-uuid', 'subject-uuid', 'school-uuid', 'low_performance', 35, 50);`,
    };
  }

  // ── MESSAGES ──────────────────────────────────────────────────
  if (i.includes('message') && (i.includes('not sending') || i.includes('not receiv') || i.includes('not show') || i.includes('fail'))) {
    return {
      text: 'Internal messaging issue — messages not being sent or received between users.',
      fixes: [
        'Messages are stored in the messages table — check if the row was actually inserted.',
        'RLS on messages must allow: sender can INSERT, recipients can SELECT their own messages.',
        'Check sender_id and recipient_id — both must be valid profile UUIDs.',
        'The conversation_id links messages in a thread — verify it\'s correctly set.',
        'Check the real-time subscription in useMessages — Supabase Realtime must be enabled on the messages table.',
      ],
      code: `-- Check recent messages\nSELECT m.id, m.content,\n       p_from.full_name AS from_user,\n       p_to.full_name AS to_user,\n       m.created_at, m.is_read\nFROM messages m\nJOIN profiles p_from ON p_from.id = m.sender_id\nJOIN profiles p_to ON p_to.id = m.recipient_id\nWHERE m.sender_id = 'your-user-uuid'\n   OR m.recipient_id = 'your-user-uuid'\nORDER BY m.created_at DESC\nLIMIT 20;\n\n-- Enable realtime on messages table (run in Supabase SQL editor)\nALTER publication supabase_realtime ADD TABLE messages;`,
    };
  }

  // ── SUPABASE CORE ERRORS ──────────────────────────────────────
  if (i.includes('pgrst116') || (i.includes('multiple rows') && !i.includes('timetable'))) {
    return {
      text: 'PGRST116 — query returned multiple rows but only one was expected.',
      fixes: [
        'Replace .single() with .maybeSingle() to safely handle null or single row.',
        'Add .limit(1) if you only need the first result.',
        'Check RLS policies — they might be exposing more rows than intended.',
      ],
      code: `// ❌ Throws on multiple rows\nconst { data } = await supabase.from('profiles').select('*').eq('role', 'teacher').single();\n\n// ✅ Safe\nconst { data } = await supabase.from('profiles').select('*').eq('role', 'teacher').maybeSingle();`,
    };
  }

  if (i.includes('pgrst204') || (i.includes('column') && i.includes('not exist')) || i.includes('42703')) {
    return {
      text: 'Column not found (42703/PGRST204). The queried column doesn\'t exist in the table.',
      fixes: [
        'Run: SELECT column_name FROM information_schema.columns WHERE table_name = \'your_table\';',
        'Check for typos — PostgreSQL column names are case-sensitive.',
        'Verify your migration ran successfully if you recently added the column.',
      ],
      code: `-- Find actual columns in a table\nSELECT column_name, data_type, is_nullable\nFROM information_schema.columns\nWHERE table_name = 'your_table'\nAND table_schema = 'public'\nORDER BY ordinal_position;`,
    };
  }

  if (i.includes('rls') || i.includes('row level security') || i.includes('permission denied') || i.includes('403')) {
    return {
      text: 'RLS is blocking the query. The current user doesn\'t satisfy the row-level security policy.',
      fixes: [
        'Check Supabase → Auth → Policies for the affected table.',
        'Verify the user\'s JWT role claim matches the policy requirement.',
        'For admin ops, use service_role key in Edge Functions (never client-side).',
        'Debug: temporarily add USING (true) to the SELECT policy to confirm RLS is the cause.',
      ],
      code: `-- Check existing policies on a table\nSELECT policyname, cmd, qual, with_check\nFROM pg_policies\nWHERE tablename = 'your_table';\n\n-- Add permissive read policy\nCREATE POLICY "authenticated_read"\nON public.your_table FOR SELECT\nTO authenticated USING (true);`,
    };
  }

  if (i.includes('foreign key') || i.includes('23503')) {
    return {
      text: 'Foreign key violation (23503). Referenced record doesn\'t exist.',
      fixes: [
        'Verify the referenced record exists before inserting.',
        'Insert parent records first (school → user → student).',
        'Check for stale IDs in sessionStorage or localStorage.',
      ],
      code: `-- Find missing FK references\nSELECT id FROM your_child_table\nWHERE parent_id NOT IN (SELECT id FROM your_parent_table);`,
    };
  }

  if (i.includes('not null') || i.includes('23502') || i.includes('null value')) {
    return {
      text: 'NOT NULL violation (23502). A required field is missing from your INSERT/UPDATE.',
      fixes: [
        'Read the error — it names the column causing the issue.',
        'Ensure all required fields are in your payload.',
        'Consider adding a DEFAULT value to the column if appropriate.',
      ],
      code: `-- Add a default value\nALTER TABLE your_table\nALTER COLUMN your_column SET DEFAULT 'default_value';`,
    };
  }

  if (i.includes('cannot read') || i.includes('undefined') || i.includes('typeerror')) {
    return {
      text: 'JavaScript TypeError — accessing a property on null or undefined.',
      fixes: [
        'Use optional chaining: obj?.property',
        'Add null guards before rendering: if (!data) return <Loading />',
        'Ensure async data is loaded before accessing it.',
      ],
      code: `// ❌ Crashes\nconst name = profile.full_name;\n// ✅ Safe\nconst name = profile?.full_name ?? 'Unknown';`,
    };
  }

  if (i.includes('cors') || i.includes('cross-origin')) {
    return {
      text: 'CORS error — browser blocked a cross-origin request.',
      fixes: [
        'Add CORS headers to your Edge Function response.',
        'Handle the OPTIONS preflight request.',
        'Never use service_role key in browser requests.',
      ],
      code: `const corsHeaders = {\n  'Access-Control-Allow-Origin': '*',\n  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',\n};\nif (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });`,
    };
  }

  if (i.includes('jwt') || (i.includes('token') && i.includes('expired'))) {
    return {
      text: 'JWT token expired or invalid.',
      fixes: [
        'Call supabase.auth.refreshSession()',
        'Clear stale "sb-" keys from localStorage.',
        'Redirect user to /login if refresh fails.',
      ],
      code: `const { error } = await supabase.auth.refreshSession();\nif (error) {\n  Object.keys(localStorage).filter(k => k.startsWith('sb-')).forEach(k => localStorage.removeItem(k));\n  navigate('/login');\n}`,
    };
  }

  if (i.includes('edge function') || i.includes('500') || i.includes('internal server')) {
    return {
      text: 'Edge Function returning 500. Something crashed inside the function.',
      fixes: [
        'Check Supabase → Edge Functions → Logs for the specific error.',
        'Wrap handler in try/catch and return structured error JSON.',
        'Verify all Deno.env.get() secrets are configured.',
      ],
      code: `Deno.serve(async (req) => {\n  try {\n    // your logic\n    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });\n  } catch (err) {\n    return new Response(JSON.stringify({ error: err.message }), { status: 500 });\n  }\n});`,
    };
  }

  if (i.includes('build') || i.includes('typescript') || i.includes('ts error')) {
    return {
      text: 'TypeScript build error.',
      fixes: [
        'Read the exact line/column in the error output.',
        'Use optional chaining for nullable values.',
        'Run npx tsc --noEmit to see all type errors.',
      ],
      code: `// Handle nullable with type narrowing\nif (profile) {\n  console.log(profile.full_name); // safe\n}`,
    };
  }

  if (i.includes('infinite loop') || i.includes('too many re-render')) {
    return {
      text: 'React infinite re-render loop.',
      fixes: [
        'Check useEffect deps — objects/arrays recreated every render cause loops.',
        'Wrap deps in useMemo or useCallback.',
        'Never setState unconditionally inside useEffect.',
      ],
      code: `// ✅ Stabilize object deps with useMemo\nconst stableFilters = useMemo(() => ({ school: schoolId }), [schoolId]);\nuseEffect(() => { fetchData(stableFilters); }, [stableFilters]);`,
    };
  }

  if (i.includes('school_id') || i.includes('tenant') || i.includes('multitenancy')) {
    return {
      text: 'Multi-tenant data isolation issue. Always scope queries to school_id.',
      fixes: [
        'Import useTenant and get schoolId before every query.',
        'Add school_id to RLS policies.',
        'Never fetch without filtering by school_id.',
      ],
      code: `const { schoolId } = useTenant();\nconst { data } = await supabase.from('students').select('*').eq('school_id', schoolId);`,
    };
  }

  // Default
  return {
    text: `I analyzed your input. Here's a general Go Smart debugging approach for: "${input.slice(0, 80)}${input.length > 80 ? '…' : ''}"`,
    fixes: [
      'Check browser DevTools → Console and Network tabs for the exact error.',
      'Check Supabase Dashboard → Logs for server-side errors.',
      'Check the relevant DB table data using the DB Inspector tab.',
      'Try the Edge Function Tester to isolate backend issues.',
      'Search Go Smart source code for the hook or component name related to the issue.',
    ],
  };
}

// ─────────────────────────────────────────────────────────────────
// Quick prompts organized by category
// ─────────────────────────────────────────────────────────────────
type Category = 'all' | 'goSmart' | 'database' | 'react';

const PROMPT_CATEGORIES: Record<Category, { label: string; icon: string }> = {
  all: { label: 'All', icon: 'ri-apps-line' },
  goSmart: { label: 'Go Smart', icon: 'ri-school-line' },
  database: { label: 'Database', icon: 'ri-database-2-line' },
  react: { label: 'React / TS', icon: 'ri-code-s-slash-line' },
};

const QUICK_PROMPTS: { text: string; category: Category }[] = [
  // Go Smart specific
  { text: 'Report card locked student can\'t view', category: 'goSmart' },
  { text: 'Report card not published pending approval', category: 'goSmart' },
  { text: 'Report card generation missing marks', category: 'goSmart' },
  { text: 'Timetable page empty no schedule showing', category: 'goSmart' },
  { text: 'Timetable conflict teacher double booked', category: 'goSmart' },
  { text: 'Attendance duplicate record already taken', category: 'goSmart' },
  { text: 'Attendance page no students no classes', category: 'goSmart' },
  { text: 'Marks entry blocked can\'t submit', category: 'goSmart' },
  { text: 'Marks approval stuck dean not seeing', category: 'goSmart' },
  { text: 'Student dashboard empty no data', category: 'goSmart' },
  { text: 'Student promotion not working', category: 'goSmart' },
  { text: 'Fee records missing no balance', category: 'goSmart' },
  { text: 'Payment not recorded duplicate payment', category: 'goSmart' },
  { text: 'Holiday packages not visible to students', category: 'goSmart' },
  { text: 'Login failing wrong password can\'t login', category: 'goSmart' },
  { text: 'User wrong role redirecting wrong dashboard', category: 'goSmart' },
  { text: 'Subscription expired school access blocked', category: 'goSmart' },
  { text: 'School onboarding failed incomplete setup', category: 'goSmart' },
  { text: 'No active term academic year missing', category: 'goSmart' },
  { text: 'SMS notifications not sending Twilio', category: 'goSmart' },
  { text: 'Email notifications failing SMTP error', category: 'goSmart' },
  { text: 'CSV import failing wrong columns', category: 'goSmart' },
  { text: 'Risk alerts not showing empty', category: 'goSmart' },
  { text: 'Messages not sending not received', category: 'goSmart' },
  // Database
  { text: 'PGRST116 multiple rows returned', category: 'database' },
  { text: 'RLS permission denied 403', category: 'database' },
  { text: 'Column does not exist 42703', category: 'database' },
  { text: 'Foreign key constraint violation 23503', category: 'database' },
  { text: 'NOT NULL constraint violation 23502', category: 'database' },
  // React / TS
  { text: 'React infinite re-render loop', category: 'react' },
  { text: 'Cannot read property of undefined TypeError', category: 'react' },
  { text: 'TypeScript build error', category: 'react' },
  { text: 'JWT token expired error', category: 'react' },
  { text: 'Edge Function returning 500', category: 'react' },
  { text: 'CORS blocked cross-origin', category: 'react' },
];

export default function AIDebugChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      text: 'Hi! I\'m the Go Smart Debug AI — I know this system inside out. Paste any error, describe what\'s broken, or pick from the prompt library below. I\'ll give you exact diagnosis + fix steps.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category>('goSmart');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  function send(text?: string) {
    const query = (text ?? input).trim();
    if (!query) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: query, timestamp: new Date() }]);
    setThinking(true);
    setTimeout(() => {
      const result = analyzeError(query);
      setMessages(prev => [...prev, { role: 'ai', ...result, timestamp: new Date() }]);
      setThinking(false);
    }, 800);
  }

  const visiblePrompts = QUICK_PROMPTS.filter(
    p => activeCategory === 'all' || p.category === activeCategory
  );

  return (
    <div className="flex flex-col h-[600px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 bg-slate-900 border-b border-slate-800 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
          <i className="ri-robot-2-line text-white text-sm" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">Go Smart Debug AI</div>
          <div className="text-xs text-slate-400">35+ error patterns · system-specific knowledge</div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-slate-500 hidden sm:block">{QUICK_PROMPTS.length} prompts</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">Online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${m.role === 'ai' ? 'bg-teal-600' : 'bg-slate-700'}`}>
              <i className={`${m.role === 'ai' ? 'ri-robot-2-line' : 'ri-user-line'} text-xs text-white`} />
            </div>
            <div className={`max-w-[84%] space-y-2 flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${m.role === 'ai' ? 'bg-slate-800 text-slate-100' : 'bg-teal-600 text-white rounded-tr-sm'}`}>
                {m.text}
              </div>
              {m.fixes && m.fixes.length > 0 && (
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 space-y-2 w-full">
                  <div className="text-xs font-semibold text-teal-400 flex items-center gap-1 mb-1">
                    <i className="ri-tools-line" /> Fix Steps
                  </div>
                  {m.fixes.map((fix, fi) => (
                    <div key={fi} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="w-4 h-4 rounded-full bg-teal-500/20 text-teal-400 flex-shrink-0 flex items-center justify-center font-bold text-[10px] mt-0.5">{fi + 1}</span>
                      <span className="leading-relaxed">{fix}</span>
                    </div>
                  ))}
                </div>
              )}
              {m.code && (
                <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden w-full">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800 border-b border-slate-700">
                    <span className="text-xs text-slate-400 font-mono flex items-center gap-1"><i className="ri-code-s-slash-line" /> Code Fix</span>
                    <button onClick={() => navigator.clipboard.writeText(m.code!)} className="text-xs text-slate-400 hover:text-teal-400 transition-colors cursor-pointer flex items-center gap-1">
                      <i className="ri-clipboard-line" /> Copy
                    </button>
                  </div>
                  <pre className="p-3 text-xs text-emerald-300 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">{m.code}</pre>
                </div>
              )}
              <span className="text-xs text-slate-600">{m.timestamp.toLocaleTimeString()}</span>
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center flex-shrink-0">
              <i className="ri-robot-2-line text-white text-xs" />
            </div>
            <div className="bg-slate-800 rounded-2xl px-4 py-3 flex items-center gap-1.5">
              {[0, 150, 300].map(d => (
                <span key={d} className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Category tabs */}
      <div className="px-4 pt-2 border-t border-slate-800 bg-slate-900 flex-shrink-0">
        <div className="flex gap-1 overflow-x-auto">
          {(Object.entries(PROMPT_CATEGORIES) as [Category, { label: string; icon: string }][]).map(([cat, meta]) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <i className={meta.icon} /> {meta.label}
              {cat !== 'all' && (
                <span className={`text-[10px] px-1 rounded-full ${activeCategory === cat ? 'bg-teal-500' : 'bg-slate-700'}`}>
                  {QUICK_PROMPTS.filter(p => p.category === cat).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt chips */}
      <div className="px-4 py-2 bg-slate-900 flex-shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {visiblePrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => send(p.text)}
              className="flex-shrink-0 text-xs px-3 py-1.5 bg-slate-800 hover:bg-teal-900 text-slate-300 hover:text-teal-300 border border-slate-700 hover:border-teal-700 rounded-full transition-all cursor-pointer whitespace-nowrap"
            >
              {p.text}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 flex-shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Paste an error or describe the problem… (Enter to send)"
            rows={2}
            className="flex-1 bg-slate-800 text-slate-100 placeholder-slate-500 text-sm px-4 py-2.5 rounded-xl resize-none focus:outline-none focus:ring-1 focus:ring-teal-500 border border-slate-700"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || thinking}
            className="w-10 h-10 bg-teal-500 hover:bg-teal-600 disabled:opacity-40 text-white rounded-xl flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer"
          >
            <i className="ri-send-plane-fill" />
          </button>
        </div>
      </div>
    </div>
  );
}
