import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}

export interface ChecklistItem {
  text: string;
}

export interface TestimonialItem {
  name: string;
  role: string;
  school: string;
  quote: string;
  photo_url: string;
  verified: boolean;
  is_founder_message?: boolean;
}

export interface LandingContent {
  id: string;
  hero_title: string;
  hero_subtitle: string;
  hero_image_url: string;
  pricing_basic: string;
  pricing_pro: string;
  pricing_enterprise: string;
  features: FeatureItem[];
  about_title: string;
  about_subtitle: string;
  about_paragraph1: string;
  about_paragraph2: string;
  about_checklist: ChecklistItem[];
  about_stat_uptime: string;
  testimonials: TestimonialItem[];
  updated_at: string;
}

export interface LiveStats {
  schoolCount: number;
  studentCount: number;
  teacherCount: number;
  deanCount: number;
  directorCount: number;
  registrarCount: number;
}

export interface TestimonialSubmission {
  id: string;
  name: string;
  role: string;
  school: string;
  quote: string;
  photo_url: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at: string | null;
}

export const DEFAULT_TESTIMONIALS: TestimonialItem[] = [
  {
    name: 'ISHIMWE Jean Bernard',
    role: 'Founder & Director',
    school: 'Go Smart System Co.',
    quote: 'Every school deserves world-class tools — regardless of size or location. We built Go Smart because we believed Rwandan schools should not have to choose between affordability and quality. Whether you are registering your first class of 30 students or managing a campus of thousands, you belong here. Welcome to the Go Smart family.',
    photo_url: '',
    verified: true,
    is_founder_message: true,
  },
  {
    name: 'Marie Claire Uwimana',
    role: 'Head Teacher',
    school: 'Bright Futures Academy',
    quote: 'The marks approval workflow is exactly what we needed. Teachers enter grades, Dean reviews, I approve — the whole process is audited and transparent. No more lost papers or disputes.',
    photo_url: '',
    verified: true,
  },
  {
    name: 'Patrick Habimana',
    role: 'Registrar',
    school: 'Green Hills Nursery',
    quote: 'Student enrollment and fee tracking used to take our whole week. With Go Smart, we register new students in under 5 minutes and parents can see balances instantly. Highly recommend it.',
    photo_url: '',
    verified: false,
  },
];

export const DEFAULT_CONTENT: Omit<LandingContent, 'id' | 'updated_at'> = {
  hero_title: 'Do You Need To Go Smart?',
  hero_subtitle: 'Please Come And Go With Us!',
  hero_image_url: '',
  pricing_basic: '50,000',
  pricing_pro: '75,000',
  pricing_enterprise: '120,000',
  features: [
    { icon: 'ri-book-2-line', title: 'Academic Management', description: 'Complete marks approval workflow with three-tier verification. Teachers enter, Dean verifies, Director approves.' },
    { icon: 'ri-building-line', title: 'Multi-School Management', description: 'Manage multiple schools with isolated data. Each school gets its own subdomain and complete independence.' },
    { icon: 'ri-user-line', title: 'Student Dashboard', description: 'Parent-friendly interface showing class, attendance rate, average score, and ranking with visual cards.' },
    { icon: 'ri-message-3-line', title: 'Messaging System', description: 'Director-monitored communication between students and teachers. All conversations tracked for safety.' },
    { icon: 'ri-alert-line', title: 'Risk Alerts', description: 'Automatic detection of academic risks, attendance issues, fee delays, and invalid marks entries.' },
    { icon: 'ri-money-dollar-circle-line', title: 'Finance Module', description: 'Complete fee management with payment tracking, financial reports, and automated reminders.' },
    { icon: 'ri-calendar-check-line', title: 'Attendance Tracking', description: 'Real-time attendance monitoring with automatic alerts for consecutive absences.' },
    { icon: 'ri-file-text-line', title: 'Report Cards', description: 'Automated report card generation with subject performance and visual analytics.' },
    { icon: 'ri-calendar-line', title: 'Timetable Management', description: 'Easy timetable creation and management for all classes and teachers.' },
  ],
  about_title: 'Built Specifically For Rwandan Schools, Designed For Global Standards',
  about_subtitle: 'WHY GO SMART SYSTEM',
  about_paragraph1: 'Our multi-tenant architecture ensures each school operates independently with its own subdomain, providing a professional identity while enjoying enterprise-grade infrastructure.',
  about_paragraph2: 'From nursery to primary education, we understand the unique challenges of Rwandan schools and have built a platform that scales seamlessly — no matter your size.',
  about_checklist: [
    { text: 'Complete data isolation per school' },
    { text: 'Subdomain-based school identity' },
    { text: 'Scalable infrastructure for all schools' },
  ],
  about_stat_uptime: '99.9%',
  testimonials: DEFAULT_TESTIMONIALS,
};

interface UseLandingContentReturn {
  content: LandingContent | null;
  liveStats: LiveStats;
  approvedTestimonials: TestimonialSubmission[];
  loading: boolean;
  error: string | null;
  saving: boolean;
  saveContent: (updates: Partial<Omit<LandingContent, 'id' | 'updated_at'>>) => Promise<boolean>;
  refetch: () => void;
}

export function useLandingContent(): UseLandingContentReturn {
  const [content, setContent] = useState<LandingContent | null>(null);
  const [liveStats, setLiveStats] = useState<LiveStats>({ schoolCount: 0, studentCount: 0, teacherCount: 0, deanCount: 0, directorCount: 0, registrarCount: 0 });
  const [approvedTestimonials, setApprovedTestimonials] = useState<TestimonialSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [contentRes, schoolsRes, studentsRes, teachersRes, deansRes, directorsRes, registrarsRes, approvedRes] = await Promise.all([
          supabase.from('landing_content').select('*').limit(1).maybeSingle(),
          supabase.from('schools').select('id', { count: 'exact', head: true }),
          supabase.from('students').select('id', { count: 'exact', head: true }),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'teacher'),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'dean'),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'director'),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'registrar'),
          supabase.from('testimonial_submissions').select('*').eq('status', 'approved').order('reviewed_at', { ascending: false }),
        ]);

        if (contentRes.error) throw contentRes.error;
        if (!cancelled) {
          setContent(contentRes.data as LandingContent | null);
          setLiveStats({
            schoolCount: schoolsRes.count ?? 0,
            studentCount: studentsRes.count ?? 0,
            teacherCount: teachersRes.count ?? 0,
            deanCount: deansRes.count ?? 0,
            directorCount: directorsRes.count ?? 0,
            registrarCount: registrarsRes.count ?? 0,
          });
          setApprovedTestimonials((approvedRes.data ?? []) as TestimonialSubmission[]);
        }
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load landing content');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll();
    return () => { cancelled = true; };
  }, [tick]);

  const saveContent = useCallback(async (
    updates: Partial<Omit<LandingContent, 'id' | 'updated_at'>>
  ): Promise<boolean> => {
    setSaving(true);
    try {
      if (!content?.id) {
        const { error: err } = await supabase
          .from('landing_content')
          .insert({ ...DEFAULT_CONTENT, ...updates, updated_at: new Date().toISOString() });
        if (err) throw err;
      } else {
        const { error: err } = await supabase
          .from('landing_content')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', content.id);
        if (err) throw err;
      }
      setContent((prev) => prev ? { ...prev, ...updates, updated_at: new Date().toISOString() } : null);
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  }, [content]);

  return { content, liveStats, approvedTestimonials, loading, error, saving, saveContent, refetch };
}
