import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotifyByRolePayload {
  mode: 'role';
  school_id: string;
  title: string;
  message: string;
  type?: string;
  icon?: string;
  roles: string[];
}

interface NotifyUserPayload {
  mode: 'user';
  school_id: string;
  user_id: string;
  title: string;
  message: string;
  type?: string;
  icon?: string;
}

type Payload = NotifyByRolePayload | NotifyUserPayload;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Use service role key so we can read any profile and insert for any user
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const payload: Payload = await req.json();
    const { school_id, title, message, type = 'info', icon = 'ri-notification-line' } = payload;

    if (!school_id || !title || !message) {
      return new Response(
        JSON.stringify({ error: 'school_id, title, and message are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    let targetUserIds: string[] = [];

    if (payload.mode === 'role') {
      if (!payload.roles || payload.roles.length === 0) {
        return new Response(
          JSON.stringify({ error: 'roles array is required for mode=role' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      const { data: profiles, error } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('school_id', school_id)
        .in('role', payload.roles);

      if (error) {
        return new Response(
          JSON.stringify({ error: `Profile lookup failed: ${error.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      targetUserIds = (profiles || []).map((p) => p.id);
    } else if (payload.mode === 'user') {
      if (!payload.user_id) {
        return new Response(
          JSON.stringify({ error: 'user_id is required for mode=user' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      targetUserIds = [payload.user_id];
    }

    if (targetUserIds.length === 0) {
      return new Response(
        JSON.stringify({ success: true, count: 0, message: 'No target users found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const notifications = targetUserIds.map((uid) => ({
      user_id: uid,
      school_id,
      title,
      message,
      type,
      icon,
      is_read: false,
    }));

    const { error: insertError } = await supabaseAdmin
      .from('app_notifications')
      .insert(notifications);

    if (insertError) {
      return new Response(
        JSON.stringify({ error: `Insert failed: ${insertError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, count: notifications.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
