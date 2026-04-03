import { supabase, getAuthToken } from '../lib/supabase';

const NOTIFY_FN_URL = 'https://kunqiuvnbtfdaraizgev.supabase.co/functions/v1/create-notification';

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationIcon =
  | 'ri-file-list-3-line'
  | 'ri-money-dollar-circle-line'
  | 'ri-user-add-line'
  | 'ri-check-double-line'
  | 'ri-alert-line'
  | 'ri-notification-3-line'
  | 'ri-notification-line'
  | 'ri-alarm-line'
  | 'ri-time-line'
  | 'ri-calendar-event-line';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

// ─── Core helper — calls the Edge Function ────────────────────────────────────

async function callNotifyFn(body: Record<string, unknown>): Promise<void> {
  try {
    const token = await getAuthToken();

    const res = await fetch(NOTIFY_FN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('[notificationService] Edge Function error:', err);
    }
  } catch (err) {
    console.error('[notificationService] Unexpected error:', err);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Send a notification to all users with the given roles in a school.
 */
export async function notifyByRole(payload: {
  schoolId: string;
  title: string;
  message: string;
  type?: NotificationType;
  icon?: NotificationIcon;
  roles: string[];
}): Promise<void> {
  await callNotifyFn({
    mode: 'role',
    school_id: payload.schoolId,
    title: payload.title,
    message: payload.message,
    type: payload.type ?? 'info',
    icon: payload.icon ?? 'ri-notification-line',
    roles: payload.roles,
  });
}

/**
 * Send a notification directly to a single user by their profile ID.
 */
export async function notifyUser(
  userId: string,
  schoolId: string,
  title: string,
  message: string,
  type: NotificationType = 'info',
  icon: NotificationIcon = 'ri-notification-line',
): Promise<void> {
  await callNotifyFn({
    mode: 'user',
    school_id: schoolId,
    user_id: userId,
    title,
    message,
    type,
    icon,
  });
}

// ─── Convenience helpers ──────────────────────────────────────────────────────

/** Notify Dean + Director + School Manager when marks are submitted */
export async function notifyMarksSubmitted(
  schoolId: string,
  teacherName: string,
  className: string,
  subjectName: string,
  count: number,
): Promise<void> {
  await notifyByRole({
    schoolId,
    title: 'Marks Submitted for Review',
    message: `${teacherName} submitted marks for ${count} student${count !== 1 ? 's' : ''} in ${className} — ${subjectName}. Pending approval.`,
    type: 'info',
    icon: 'ri-file-list-3-line',
    roles: ['dean', 'director', 'school_manager'],
  });
}

/** Notify the teacher whose marks were approved */
export async function notifyMarksApproved(
  teacherId: string,
  schoolId: string,
  className: string,
  subjectName: string,
  count: number,
  deanName: string,
): Promise<void> {
  await notifyUser(
    teacherId,
    schoolId,
    'Marks Approved',
    `Your marks for ${count} student${count !== 1 ? 's' : ''} in ${className} — ${subjectName} were approved by ${deanName} and forwarded to the Director.`,
    'success',
    'ri-check-double-line',
  );
}

/** Notify the teacher whose marks were rejected */
export async function notifyMarksRejected(
  teacherId: string,
  schoolId: string,
  className: string,
  subjectName: string,
  count: number,
  deanName: string,
  reason: string,
): Promise<void> {
  await notifyUser(
    teacherId,
    schoolId,
    'Marks Returned for Correction',
    `Your marks for ${count} student${count !== 1 ? 's' : ''} in ${className} — ${subjectName} were returned by ${deanName}. Reason: "${reason}"`,
    'warning',
    'ri-alert-line',
  );
}

/** Notify Director + Accountant + School Manager when a fee payment is received */
export async function notifyFeePayment(
  schoolId: string,
  studentName: string,
  amount: number,
  method: string,
): Promise<void> {
  const formatted = new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    minimumFractionDigits: 0,
  }).format(amount);

  await notifyByRole({
    schoolId,
    title: 'Fee Payment Received',
    message: `Payment of ${formatted} recorded for ${studentName} via ${method.charAt(0).toUpperCase() + method.slice(1)}.`,
    type: 'success',
    icon: 'ri-money-dollar-circle-line',
    roles: ['director', 'school_manager', 'accountant'],
  });
}

/** Notify Director + School Manager + Registrar when a student is enrolled */
export async function notifyStudentEnrolled(
  schoolId: string,
  studentName: string,
  className: string,
): Promise<void> {
  await notifyByRole({
    schoolId,
    title: 'New Student Enrolled',
    message: `${studentName} has been registered and enrolled in ${className || 'a class'}.`,
    type: 'success',
    icon: 'ri-user-add-line',
    roles: ['director', 'school_manager', 'registrar'],
  });
}
