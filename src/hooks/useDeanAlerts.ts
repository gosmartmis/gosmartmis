import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface MarkAlert {
  id: string;
  school_id: string;
  alert_type: string;
  teacher_id: string | null;
  teacher_name: string | null;
  subject_name: string | null;
  class_name: string | null;
  term_name: string | null;
  student_count: number;
  read_at: string | null;
  created_at: string;
}

export function useDeanAlerts(schoolId: string | null | undefined) {
  const [alerts, setAlerts] = useState<MarkAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await supabase
        .from('mark_alerts')
        .select('*')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false })
        .limit(50);
      setAlerts(data || []);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    fetchAlerts();

    // Subscribe to new alerts in real-time
    if (!schoolId) return;
    const channel = supabase
      .channel('mark_alerts_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mark_alerts', filter: `school_id=eq.${schoolId}` },
        (payload) => {
          setAlerts(prev => [payload.new as MarkAlert, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchAlerts, schoolId]);

  const markAsRead = useCallback(async (id: string) => {
    const now = new Date().toISOString();
    await supabase.from('mark_alerts').update({ read_at: now }).eq('id', id);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read_at: now } : a));
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!schoolId) return;
    const unreadIds = alerts.filter(a => !a.read_at).map(a => a.id);
    if (!unreadIds.length) return;
    const now = new Date().toISOString();
    await supabase.from('mark_alerts').update({ read_at: now }).in('id', unreadIds);
    setAlerts(prev => prev.map(a => ({ ...a, read_at: a.read_at ?? now })));
  }, [schoolId, alerts]);

  const unreadCount = alerts.filter(a => !a.read_at).length;

  return {
    alerts,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refetch: fetchAlerts,
  };
}
