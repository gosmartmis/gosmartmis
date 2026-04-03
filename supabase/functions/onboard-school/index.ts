import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Verify the caller is a super-admin
    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const { data: { user } } = await callerClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    const { data: profile } = await callerClient
      .from('profiles').select('role').eq('id', user.id).maybeSingle()
    if (profile?.role !== 'super-admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: super-admin only' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Service-role client for privileged operations
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { school_id, school_name, school_slug, director_name, director_email, send_welcome_email } = await req.json()

    if (!school_id || !director_email) {
      return new Response(JSON.stringify({ error: 'school_id and director_email are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ── 1. Create director auth account ──────────────────────────────────────
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    const rand = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    const tempPassword = `GoSmart@${rand}`

    let userId: string | null = null
    let userAlreadyExisted = false

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: director_email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: director_name || 'School Director' }
    })

    if (authError) {
      if (authError.message.includes('already been registered') || authError.message.includes('already exists')) {
        // User exists — look them up
        const { data: existingUsers } = await adminClient.auth.admin.listUsers()
        const existing = existingUsers?.users?.find((u) => u.email === director_email)
        userId = existing?.id ?? null
        userAlreadyExisted = true
      } else {
        return new Response(JSON.stringify({ error: authError.message }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    } else {
      userId = authData.user?.id ?? null
    }

    // ── 2. Upsert profile record ──────────────────────────────────────────────
    if (userId) {
      await adminClient.from('profiles').upsert({
        id: userId,
        school_id,
        full_name: director_name || 'School Director',
        email: director_email,
        role: 'director',
      }, { onConflict: 'id' })
    }

    // ── 3. Generate a password-reset link so they can set their own password ──
    let resetLink = ''
    if (userId) {
      const { data: linkData } = await adminClient.auth.admin.generateLink({
        type: 'recovery',
        email: director_email,
        options: { redirectTo: `https://${school_slug}.gosmartmis.rw/login` }
      })
      resetLink = linkData?.properties?.action_link ?? ''
    }

    // ── 4. Send welcome email via Resend ─────────────────────────────────────
    let emailSent = false
    let emailError = ''

    if (send_welcome_email) {
      const resendApiKey = Deno.env.get('RESEND_API_KEY')
      if (!resendApiKey) {
        emailError = 'RESEND_API_KEY secret is not configured. Add it in Supabase Dashboard → Edge Functions → Secrets.'
      } else {
        const loginUrl = `https://${school_slug}.gosmartmis.rw/login`
        const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0d9488,#059669);padding:40px 32px;text-align:center;">
      <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:14px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
        <span style="color:white;font-size:28px;font-weight:800;">${(school_name || 'S').charAt(0).toUpperCase()}</span>
      </div>
      <h1 style="color:white;margin:0;font-size:22px;font-weight:700;">Welcome to GoSmart MIS</h1>
      <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:15px;">${school_name} is live and ready</p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="color:#374151;font-size:15px;margin:0 0 16px;">Hi <strong>${director_name || 'Director'}</strong>,</p>
      <p style="color:#374151;font-size:15px;margin:0 0 24px;">
        Your school <strong>${school_name}</strong> has been successfully set up on GoSmart MIS.
        Your Director account is ready — here are your login details:
      </p>

      <!-- Credentials box -->
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin:0 0 24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:13px;width:120px;">Login URL</td>
            <td style="padding:8px 0;"><a href="${loginUrl}" style="color:#0d9488;font-weight:600;font-size:14px;text-decoration:none;">${loginUrl}</a></td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:13px;">Email</td>
            <td style="padding:8px 0;color:#111827;font-weight:600;font-size:14px;">${director_email}</td>
          </tr>
          ${!userAlreadyExisted ? `
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:13px;">Temp Password</td>
            <td style="padding:8px 0;">
              <span style="font-family:monospace;font-size:16px;font-weight:700;background:#e5e7eb;padding:6px 12px;border-radius:6px;color:#111827;">${tempPassword}</span>
            </td>
          </tr>
          ` : ''}
        </table>
      </div>

      ${resetLink ? `
      <!-- CTA button -->
      <div style="text-align:center;margin:0 0 24px;">
        <a href="${resetLink}"
          style="background:linear-gradient(135deg,#0d9488,#059669);color:white;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
          Set Your Permanent Password
        </a>
      </div>
      <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0 0 24px;">
        This link expires in 24 hours. We strongly recommend setting a new password before your first login.
      </p>
      ` : ''}

      <!-- Getting started steps -->
      <div style="border-top:1px solid #f3f4f6;padding-top:24px;margin-top:8px;">
        <p style="color:#111827;font-size:14px;font-weight:600;margin:0 0 12px;">Quick Start — 5 Steps</p>
        ${[
          'Log in and change your password',
          'Set up your Academic Year and Terms',
          'Add your Classes and Subjects',
          'Have your Registrar enroll students',
          'Assign Teachers to their classes',
        ].map((step, i) => `
        <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:10px;">
          <div style="width:22px;height:22px;background:#0d9488;border-radius:50%;color:white;font-size:11px;font-weight:700;text-align:center;line-height:22px;flex-shrink:0;">${i + 1}</div>
          <p style="margin:0;color:#374151;font-size:14px;line-height:22px;">${step}</p>
        </div>
        `).join('')}
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;text-align:center;">
      <p style="color:#6b7280;font-size:12px;margin:0 0 4px;">Need help? Reach us at <a href="mailto:support@gosmartmis.rw" style="color:#0d9488;">support@gosmartmis.rw</a></p>
      <p style="color:#9ca3af;font-size:11px;margin:0;">© ${new Date().getFullYear()} GoSmart MIS. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`

        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'GoSmart MIS <onboarding@gosmartmis.rw>',
            to: [director_email],
            subject: `Welcome to GoSmart MIS — ${school_name} is ready!`,
            html,
          })
        })

        if (emailRes.ok) {
          emailSent = true
        } else {
          const errBody = await emailRes.text()
          emailError = `Resend API error: ${errBody}`
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      user_created: !userAlreadyExisted,
      user_already_existed: userAlreadyExisted,
      user_id: userId,
      temp_password: userAlreadyExisted ? null : tempPassword,
      reset_link: resetLink,
      email_sent: emailSent,
      email_error: emailError || null,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
