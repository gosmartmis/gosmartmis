import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { registration_number, school_slug, school_id } = await req.json()

    if (!registration_number || typeof registration_number !== 'string') {
      return new Response(JSON.stringify({ found: false, error: 'registration_number required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Normalize the registration number (trim, uppercase)
    const normalized = registration_number.trim().toUpperCase()

    // Build query
    let query = adminClient
      .from('profiles')
      .select('id, email, full_name, role, school_id, is_active, registration_number')
      .eq('registration_number', normalized)

    // If school_id or school_slug provided, scope to that school
    if (school_id) {
      query = query.eq('school_id', school_id)
    } else if (school_slug) {
      // Join via schools table
      const { data: school } = await adminClient
        .from('schools')
        .select('id')
        .eq('slug', school_slug)
        .maybeSingle()
      if (school?.id) {
        query = query.eq('school_id', school.id)
      }
    }

    const { data: profile, error } = await query.maybeSingle()

    if (error || !profile) {
      return new Response(JSON.stringify({ found: false, error: 'Registration number not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!profile.is_active) {
      return new Response(JSON.stringify({ found: false, error: 'This account has been deactivated. Please contact your school administrator.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      found: true,
      email: profile.email,
      full_name: profile.full_name,
      role: profile.role,
      school_id: profile.school_id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ found: false, error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
