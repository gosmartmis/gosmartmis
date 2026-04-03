import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReminderRequest {
  school_id: string;
  days_threshold?: number; // notify if due within this many days (default 7)
}

interface ReminderResult {
  overdue: number;
  due_today: number;
  due_soon: number;
  notifications_sent: number;
  errors: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: ReminderRequest = await req.json();
    const { school_id, days_threshold = 7 } = body;

    if (!school_id) {
      return new Response(JSON.stringify({ error: 'school_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thresholdDate = new Date(today);
    thresholdDate.setDate(thresholdDate.getDate() + days_threshold);

    // Fetch all unpaid/partial fee records for this school with a due_date set
    const { data: feeRecords, error: feeError } = await supabase
      .from('fee_records')
      .select(`
        id,
        student_id,
        amount_due,
        amount_paid,
        balance,
        due_date,
        status,
        students!inner (
          id,
          full_name,
          profile_id,
          parent_name,
          parent_phone,
          parent_email,
          classes:class_id (
            name
          )
        )
      `)
      .eq('school_id', school_id)
      .gt('balance', 0)
      .not('status', 'eq', 'paid')
      .not('due_date', 'is', null)
      .lte('due_date', thresholdDate.toISOString().split('T')[0]);

    if (feeError) {
      console.error('Error fetching fee records:', feeError);
      return new Response(JSON.stringify({ error: feeError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result: ReminderResult = {
      overdue: 0,
      due_today: 0,
      due_soon: 0,
      notifications_sent: 0,
      errors: [],
    };

    const studentNotifications: Array<{
      user_id: string;
      school_id: string;
      title: string;
      message: string;
      type: string;
      icon: string;
      is_read: boolean;
    }> = [];

    const affectedStudents: string[] = [];

    for (const record of feeRecords || []) {
      const student = record.students as any;
      const dueDate = new Date(record.due_date);
      dueDate.setHours(0, 0, 0, 0);
      const msPerDay = 1000 * 60 * 60 * 24;
      const daysUntilDue = Math.round((dueDate.getTime() - today.getTime()) / msPerDay);

      const formatted = new Intl.NumberFormat('en-RW', {
        style: 'currency',
        currency: 'RWF',
        minimumFractionDigits: 0,
      }).format(Number(record.balance));

      const dueDateStr = dueDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      const className = student?.classes?.name || 'your class';
      const studentName = student?.full_name || 'Student';

      let title: string;
      let message: string;
      let type: string;
      let icon: string;

      if (daysUntilDue < 0) {
        result.overdue++;
        title = 'Fee Payment Overdue';
        message = `Your fee balance of ${formatted} for ${className} was due on ${dueDateStr}. Please make payment immediately to avoid disruption.`;
        type = 'error';
        icon = 'ri-alert-line';
      } else if (daysUntilDue === 0) {
        result.due_today++;
        title = 'Fee Payment Due Today';
        message = `Your fee balance of ${formatted} for ${className} is due today (${dueDateStr}). Please make payment at the school office.`;
        type = 'warning';
        icon = 'ri-time-line';
      } else {
        result.due_soon++;
        title = `Fee Payment Due in ${daysUntilDue} Day${daysUntilDue > 1 ? 's' : ''}`;
        message = `Your fee balance of ${formatted} for ${className} is due on ${dueDateStr}. Please arrange payment before the deadline.`;
        type = 'warning';
        icon = 'ri-money-dollar-circle-line';
      }

      // Notify the student's portal account if they have one
      if (student?.profile_id) {
        studentNotifications.push({
          user_id: student.profile_id,
          school_id,
          title,
          message,
          type,
          icon,
          is_read: false,
        });
        affectedStudents.push(studentName);
      }
    }

    // Bulk-insert student notifications
    if (studentNotifications.length > 0) {
      const { error: insertError } = await supabase
        .from('app_notifications')
        .insert(studentNotifications);

      if (insertError) {
        result.errors.push(`Student notifications: ${insertError.message}`);
      } else {
        result.notifications_sent += studentNotifications.length;
      }
    }

    // Build staff summary notification (accountant + director)
    if (feeRecords && feeRecords.length > 0) {
      const summaryParts: string[] = [];
      if (result.overdue > 0) summaryParts.push(`${result.overdue} overdue`);
      if (result.due_today > 0) summaryParts.push(`${result.due_today} due today`);
      if (result.due_soon > 0) summaryParts.push(`${result.due_soon} due soon`);

      const summaryMessage = `Fee reminder check: ${summaryParts.join(', ')} (${feeRecords.length} total unpaid records). Student notifications sent.`;

      const { data: staffProfiles, error: staffError } = await supabase
        .from('profiles')
        .select('id')
        .eq('school_id', school_id)
        .in('role', ['accountant', 'director', 'school_manager']);

      if (!staffError && staffProfiles && staffProfiles.length > 0) {
        const staffNotifications = staffProfiles.map((p) => ({
          user_id: p.id,
          school_id,
          title: 'Fee Reminders Sent',
          message: summaryMessage,
          type: result.overdue > 0 ? 'warning' : 'info',
          icon: 'ri-notification-3-line',
          is_read: false,
        }));

        const { error: staffInsertError } = await supabase
          .from('app_notifications')
          .insert(staffNotifications);

        if (staffInsertError) {
          result.errors.push(`Staff notifications: ${staffInsertError.message}`);
        } else {
          result.notifications_sent += staffNotifications.length;
        }
      }
    }

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
