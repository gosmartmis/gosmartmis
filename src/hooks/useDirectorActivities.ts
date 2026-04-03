import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface DirectorActivity {
  id: string;
  icon: string;
  text: string;
  time: string;
  color: string;
  type: 'marks' | 'approval' | 'registration' | 'message' | 'payment';
}

interface UseDirectorActivitiesReturn {
  activities: DirectorActivity[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useDirectorActivities = (schoolId: string | null): UseDirectorActivitiesReturn => {
  const [activities, setActivities] = useState<DirectorActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const allActivities: DirectorActivity[] = [];

      // Fetch recent marks entries
      const { data: marksData } = await supabase
        .from('marks')
        .select(`
          id,
          created_at,
          classes:class_id (name),
          subjects:subject_id (name)
        `)
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false })
        .limit(5);

      marksData?.forEach(mark => {
        allActivities.push({
          id: `mark-${mark.id}`,
          icon: 'ri-file-edit-line',
          text: `Marks entered for ${mark.classes?.name || 'Unknown'} ${mark.subjects?.name || 'Unknown'}`,
          time: formatTimeAgo(mark.created_at),
          color: 'bg-blue-100 text-blue-600',
          type: 'marks'
        });
      });

      // Fetch recent approvals
      const { data: approvalsData } = await supabase
        .from('marks')
        .select(`
          id,
          updated_at,
          status,
          classes:class_id (name),
          subjects:subject_id (name)
        `)
        .eq('school_id', schoolId)
        .in('status', ['verified', 'approved'])
        .order('updated_at', { ascending: false })
        .limit(5);

      approvalsData?.forEach(approval => {
        allActivities.push({
          id: `approval-${approval.id}`,
          icon: 'ri-check-double-line',
          text: `Dean approved marks for ${approval.classes?.name || 'Unknown'} ${approval.subjects?.name || 'Unknown'}`,
          time: formatTimeAgo(approval.updated_at),
          color: 'bg-green-100 text-green-600',
          type: 'approval'
        });
      });

      // Fetch recent student registrations
      const { data: studentsData } = await supabase
        .from('students')
        .select('id, full_name, created_at')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false })
        .limit(3);

      studentsData?.forEach(student => {
        allActivities.push({
          id: `student-${student.id}`,
          icon: 'ri-user-add-line',
          text: `New student registered: ${student.full_name}`,
          time: formatTimeAgo(student.created_at),
          color: 'bg-purple-100 text-purple-600',
          type: 'registration'
        });
      });

      // Fetch recent messages
      const { data: messagesData } = await supabase
        .from('messages')
        .select(`
          id,
          created_at,
          profiles:sender_id (full_name)
        `)
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false })
        .limit(3);

      messagesData?.forEach(msg => {
        const senderName = (msg.profiles as { full_name?: string } | null)?.full_name || 'Unknown';
        allActivities.push({
          id: `message-${msg.id}`,
          icon: 'ri-message-3-line',
          text: `New message from ${senderName}`,
          time: formatTimeAgo(msg.created_at),
          color: 'bg-amber-100 text-amber-600',
          type: 'message'
        });
      });

      // Fetch recent fee payments
      const { data: paymentsData } = await supabase
        .from('fee_payments')
        .select(`
          id,
          created_at,
          students:student_id (full_name)
        `)
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false })
        .limit(3);

      paymentsData?.forEach(payment => {
        const studentName = (payment.students as { full_name?: string } | null)?.full_name || 'Unknown';
        allActivities.push({
          id: `payment-${payment.id}`,
          icon: 'ri-money-dollar-circle-line',
          text: `Fee payment received: ${studentName}`,
          time: formatTimeAgo(payment.created_at),
          color: 'bg-teal-100 text-teal-600',
          type: 'payment'
        });
      });

      // Sort all activities by time
      allActivities.sort((a, b) => {
        const timeA = parseTimeAgo(a.time);
        const timeB = parseTimeAgo(b.time);
        return timeA - timeB;
      });

      setActivities(allActivities.slice(0, 5));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activities');
      console.error('Error fetching director activities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [schoolId]);

  return { activities, loading, error, refetch: fetchActivities };
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

function parseTimeAgo(timeStr: string): number {
  if (timeStr === 'Just now') return 0;
  if (timeStr.includes('minutes ago')) return parseInt(timeStr) * 60 * 1000;
  if (timeStr.includes('hours ago')) return parseInt(timeStr) * 60 * 60 * 1000;
  if (timeStr === 'Yesterday') return 24 * 60 * 60 * 1000;
  if (timeStr.includes('days ago')) return parseInt(timeStr) * 24 * 60 * 60 * 1000;
  return Date.now();
}