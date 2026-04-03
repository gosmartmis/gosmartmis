import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface RecentActivity {
  id: string;
  action: string;
  target: string;
  time: string;
  icon: string;
  type: 'marks' | 'attendance' | 'message' | 'other';
}

interface UseRecentActivityReturn {
  activities: RecentActivity[];
  loading: boolean;
  error: string | null;
}

export const useRecentActivity = (
  schoolId: string | null,
  teacherId: string | null
): UseRecentActivityReturn => {
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      if (!schoolId || !teacherId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const allActivities: RecentActivity[] = [];

        // Fetch recent marks entries
        const { data: marksData } = await supabase
          .from('marks')
          .select(`
            id,
            created_at,
            exam_type,
            classes:class_id (name),
            subjects:subject_id (name)
          `)
          .eq('school_id', schoolId)
          .eq('teacher_id', teacherId)
          .order('created_at', { ascending: false })
          .limit(5);

        marksData?.forEach(mark => {
          allActivities.push({
            id: mark.id,
            action: 'Entered marks for',
            target: `${mark.classes?.name || 'Unknown'} ${mark.subjects?.name || 'Unknown'}`,
            time: formatTimeAgo(mark.created_at),
            icon: 'ri-file-list-3-line',
            type: 'marks',
          });
        });

        // Fetch recent attendance records
        const { data: attendanceData } = await supabase
          .from('attendance')
          .select(`
            id,
            created_at,
            classes:class_id (name)
          `)
          .eq('school_id', schoolId)
          .eq('teacher_id', teacherId)
          .order('created_at', { ascending: false })
          .limit(5);

        attendanceData?.forEach(att => {
          allActivities.push({
            id: att.id,
            action: 'Took attendance for',
            target: att.classes?.name || 'Unknown',
            time: formatTimeAgo(att.created_at),
            icon: 'ri-calendar-check-line',
            type: 'attendance',
          });
        });

        // Fetch recent messages
        const { data: messagesData } = await supabase
          .from('messages')
          .select(`
            id,
            created_at,
            sender_id,
            profiles:sender_id (full_name)
          `)
          .eq('recipient_id', teacherId)
          .order('created_at', { ascending: false })
          .limit(3);

        messagesData?.forEach(msg => {
          allActivities.push({
            id: msg.id,
            action: 'Received message from',
            target: (msg.profiles as { full_name?: string } | null)?.full_name || 'Unknown',
            time: formatTimeAgo(msg.created_at),
            icon: 'ri-message-3-line',
            type: 'message',
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
        setError(err instanceof Error ? err.message : 'Failed to fetch recent activity');
        console.error('Error fetching recent activity:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [schoolId, teacherId]);

  return { activities, loading, error };
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

function parseTimeAgo(timeStr: string): number {
  if (timeStr.includes('min ago')) {
    return parseInt(timeStr) * 60 * 1000;
  }
  if (timeStr.includes('hours ago')) {
    return parseInt(timeStr) * 60 * 60 * 1000;
  }
  if (timeStr === 'Yesterday') {
    return 24 * 60 * 60 * 1000;
  }
  if (timeStr.includes('days ago')) {
    return parseInt(timeStr) * 24 * 60 * 60 * 1000;
  }
  return Date.now();
}