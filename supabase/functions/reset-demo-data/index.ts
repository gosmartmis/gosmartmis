import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const DEMO_SCHOOL_SLUG = 'demo';

Deno.serve(async (req) => {
  // Allow manual trigger via POST or scheduled cron GET
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    // Find demo school
    const { data: school } = await supabase
      .from('schools')
      .select('id')
      .eq('slug', DEMO_SCHOOL_SLUG)
      .maybeSingle();

    if (!school) {
      return new Response(JSON.stringify({ error: 'Demo school not found' }), { status: 404 });
    }

    const schoolId = school.id;

    // Delete transactional data only — keep users/profiles/students intact
    const tables = [
      'marks',
      'attendance',
      'fee_payments',
      'fee_records',
      'messages',
      'app_notifications',
      'notifications',
      'notification_logs',
      'mark_alerts',
    ];

    const results: Record<string, string> = {};

    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('school_id', schoolId);
      results[table] = error ? `error: ${error.message}` : 'cleared';
    }

    // Re-seed minimal demo marks data
    // (In production, call a separate seed function or insert rows here)

    return new Response(
      JSON.stringify({
        success: true,
        school_id: schoolId,
        reset_at: new Date().toISOString(),
        tables: results,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
