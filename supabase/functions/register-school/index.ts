declare const Deno: {
  env: { get: (key: string) => string | undefined }
  serve: (handler: (req: Request) => Response | Promise<Response>) => void
}

// @ts-ignore: Deno Edge Functions support URL imports at runtime; TS in the web app workspace cannot resolve this module.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { generateDefaultPassword, sendWelcomeEmailViaResend } from '../_shared/onboarding.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}

function normalizePlan(plan: string | undefined) {
  const raw = (plan || 'trial').trim().toLowerCase()

  // Backward + current frontend compatibility
  const normalized =
    raw === 'nursery' ? 'starter' :
    raw === 'primary' ? 'pro' :
    raw === 'nursery-primary' ? 'enterprise' :
    raw

  const allowed = ['trial', 'starter', 'pro', 'enterprise']
  return allowed.includes(normalized) ? normalized : 'trial'
}

async function ensureNoCrossTenantReassignment(admin: any, userId: string, schoolId: string) {
  const { data: existingProfile } = await admin
    .from('profiles')
    .select('school_id')
    .eq('id', userId)
    .maybeSingle()

  if (existingProfile?.school_id && existingProfile.school_id !== schoolId) {
    throw new Error('Cross-tenant user reassignment is blocked')
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  // ── GET: slug availability check ──────────────────────────────────────────
  if (req.method === 'GET') {
    const url = new URL(req.url)
    const slug = url.searchParams.get('slug')?.trim().toLowerCase()
    if (!slug) return json({ available: false, error: 'slug is required' }, 400)
    if (!/^[a-z0-9][a-z0-9-]{2,29}$/.test(slug)) {
      return json({ available: false, error: 'Slug must be 3-30 characters, lowercase letters, numbers and hyphens only, and cannot start with a hyphen.' })
    }
    const reserved = ['www', 'admin', 'app', 'api', 'mail', 'support', 'help', 'blog', 'demo', 'test', 'staging']
    if (reserved.includes(slug)) return json({ available: false, error: 'This subdomain is reserved.' })
    const { data } = await admin.from('schools').select('id').eq('slug', slug).maybeSingle()
    return json({ available: !data })
  }

  // ── POST: register school ─────────────────────────────────────────────────
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  let body: {
    school_name?: string; slug?: string; phone?: string; address?: string;
    director_name?: string; director_email?: string; plan?: string; primary_color?: string;
  }
  try { body = await req.json() } catch { return json({ error: 'Invalid JSON body' }, 400) }

  const {
    school_name, slug, phone, address,
    director_name, director_email,
    plan = 'trial', primary_color = '#0d9488',
  } = body

  const normalizedPlan = normalizePlan(plan)

  if (!school_name?.trim()) return json({ error: 'school_name is required' }, 400)
  if (!slug?.trim()) return json({ error: 'slug is required' }, 400)
  if (!director_email?.trim()) return json({ error: 'director_email is required' }, 400)
  if (!director_name?.trim()) return json({ error: 'director_name is required' }, 400)

  const cleanSlug = slug.trim().toLowerCase()
  if (!/^[a-z0-9][a-z0-9-]{2,29}$/.test(cleanSlug)) {
    return json({ error: 'Invalid subdomain format. Use 3-30 lowercase letters, numbers or hyphens.' }, 400)
  }

  const { data: existing } = await admin.from('schools').select('id').eq('slug', cleanSlug).maybeSingle()
  if (existing) return json({ error: 'This subdomain is already taken. Please choose another.' }, 409)

  // Trial expiry: 14 days
  const trialExpiry = new Date()
  trialExpiry.setDate(trialExpiry.getDate() + 14)
  const expiryDate = trialExpiry.toISOString().split('T')[0]

  // Create school record
  const { data: school, error: schoolErr } = await admin.from('schools').insert({
    name: school_name.trim(),
    slug: cleanSlug,
    phone: phone?.trim() || null,
    address: address?.trim() || null,
    email: director_email.trim(),
    subscription_status: normalizedPlan === 'trial' ? 'trial' : 'active',
    subscription_plan: normalizedPlan,
    subscription_expiry_date: expiryDate,
    is_active: true,
    max_students: normalizedPlan === 'enterprise' ? 5000 : normalizedPlan === 'pro' ? 2000 : normalizedPlan === 'starter' ? 500 : 150,
    max_teachers: normalizedPlan === 'enterprise' ? 500 : normalizedPlan === 'pro' ? 200 : normalizedPlan === 'starter' ? 50 : 15,
    primary_color,
    secondary_color: '#059669',
  }).select().maybeSingle()

  if (schoolErr || !school) {
    return json({ error: schoolErr?.message || 'Failed to create school record' }, 500)
  }

  // Create director auth account
  const tempPassword = generateDefaultPassword()

  let userId: string | null = null
  let userAlreadyExisted = false

  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email: director_email.trim(),
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: director_name.trim() },
  })

  if (authErr) {
    if (authErr.message.includes('already') || authErr.message.includes('registered')) {
      const { data: list } = await admin.auth.admin.listUsers()
      const found = list?.users?.find((u: { email?: string; id?: string }) => u.email === director_email.trim())
      userId = found?.id ?? null
      userAlreadyExisted = true
    } else {
      await admin.from('schools').delete().eq('id', school.id)
      return json({ error: `Could not create director account: ${authErr.message}` }, 500)
    }
  } else {
    userId = authData.user?.id ?? null
  }

  if (userId && userAlreadyExisted) {
    const { error: forceResetError } = await admin.auth.admin.updateUserById(userId, { password: tempPassword })
    if (forceResetError) {
      await admin.from('schools').delete().eq('id', school.id)
      return json({ error: `Could not set director default password: ${forceResetError.message}` }, 500)
    }
  }

  if (userId) {
    try {
      await ensureNoCrossTenantReassignment(admin, userId, school.id)
    } catch (err: any) {
      await admin.from('schools').delete().eq('id', school.id)
      return json({ error: err?.message || 'Cross-tenant user reassignment is blocked' }, 403)
    }

    await admin.from('profiles').upsert({
      id: userId,
      school_id: school.id,
      full_name: director_name.trim(),
      email: director_email.trim(),
      role: 'director',
      must_change_password: true,
    }, { onConflict: 'id' })
  }

  // Generate password-reset link
  let resetLink = ''
  if (userId) {
    const { data: linkData } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: director_email.trim(),
      options: { redirectTo: `https://${cleanSlug}.gosmartmis.rw/login` },
    })
    resetLink = linkData?.properties?.action_link ?? ''
  }

  // ── Welcome email via Resend ───────────────────────────────────────────────
  let emailSent = false
  let emailError: string | null = null
  const resendKey = Deno.env.get('RESEND_API_KEY')

  if (resendKey) {
    const loginUrl = `https://${cleanSlug}.gosmartmis.rw/login`
    const brandColor = primary_color || '#0d9488'
    const initial = school_name.trim().charAt(0).toUpperCase()

    const planLabel = normalizedPlan === 'trial'
      ? '14-day Free Trial'
      : normalizedPlan === 'starter'
      ? 'Starter Plan'
      : normalizedPlan === 'pro'
      ? 'Professional Plan'
      : 'Enterprise Plan'

    const credentialsBlock = !userAlreadyExisted
      ? `<tr>
          <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
            <span style="color:#6b7280;font-size:12px;display:block;margin-bottom:4px;">Temporary Password</span>
            <code style="font-size:18px;font-weight:700;background:#fef3c7;color:#92400e;padding:6px 14px;border-radius:8px;display:inline-block;letter-spacing:1px;">${tempPassword}</code>
          </td>
        </tr>`
      : ''

    const resetBlock = resetLink
      ? `<div style="text-align:center;margin:28px 0;">
          <a href="${resetLink}"
            style="background:linear-gradient(135deg,${brandColor},#059669);color:white;padding:14px 40px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
            Set Your Permanent Password
          </a>
          <p style="color:#9ca3af;font-size:11px;margin:10px 0 0;">This link expires in 24 hours</p>
        </div>`
      : ''

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Welcome to GoSmart MIS</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:32px auto;padding:0 16px;">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,${brandColor} 0%,#059669 100%);border-radius:16px 16px 0 0;padding:40px 32px;text-align:center;">
    <div style="width:60px;height:60px;background:rgba(255,255,255,0.2);border-radius:14px;margin:0 auto 16px;display:inline-flex;align-items:center;justify-content:center;">
      <span style="color:white;font-size:30px;font-weight:800;line-height:1;">${initial}</span>
    </div>
    <h1 style="color:white;margin:0 0 8px;font-size:24px;font-weight:800;">Your School is Live! &#127881;</h1>
    <p style="color:rgba(255,255,255,0.85);margin:0;font-size:15px;">${school_name} is now on GoSmart MIS</p>
  </div>

  <!-- Body -->
  <div style="background:white;padding:32px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
    <p style="color:#374151;font-size:15px;margin:0 0 8px;">Hi <strong>${director_name}</strong>,</p>
    <p style="color:#374151;font-size:15px;margin:0 0 24px;">
      Welcome to GoSmart MIS! Your school portal is ready to go. Here are your login details:
    </p>

    <!-- Credentials Box -->
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
            <span style="color:#6b7280;font-size:12px;display:block;margin-bottom:4px;">Portal URL</span>
            <a href="${loginUrl}" style="color:${brandColor};font-weight:700;font-size:15px;text-decoration:none;">${loginUrl}</a>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
            <span style="color:#6b7280;font-size:12px;display:block;margin-bottom:4px;">Email</span>
            <span style="color:#111827;font-weight:600;font-size:14px;">${director_email}</span>
          </td>
        </tr>
        ${credentialsBlock}
        <tr>
          <td style="padding:10px 0;">
            <span style="color:#6b7280;font-size:12px;display:block;margin-bottom:4px;">Plan</span>
            <span style="color:#111827;font-weight:600;font-size:14px;">${planLabel} &bull; expires <strong>${expiryDate}</strong></span>
          </td>
        </tr>
      </table>
    </div>

    ${resetBlock}

    <!-- Quick start steps -->
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-weight:700;color:#166534;font-size:14px;">Quick Start Checklist</p>
      ${['Log in and set your permanent password','Set up Academic Year and Terms','Add Classes and Subjects','Register teachers and assign classes','Start enrolling students']
        .map((s, i) => `<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:8px;">
          <span style="min-width:22px;height:22px;background:${brandColor};color:white;border-radius:50%;font-size:11px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;">${i + 1}</span>
          <span style="color:#374151;font-size:13px;padding-top:3px;">${s}</span>
        </div>`).join('')}
    </div>

    <p style="color:#6b7280;font-size:13px;margin:0;">
      Need help? Reply to this email or contact us at
      <a href="mailto:support@gosmartmis.rw" style="color:${brandColor};">support@gosmartmis.rw</a>
    </p>
  </div>

  <!-- Footer -->
  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
    <p style="color:#9ca3af;font-size:12px;margin:0;">
      &copy; ${new Date().getFullYear()} GoSmart MIS &bull;
      <a href="https://gosmartmis.rw" style="color:${brandColor};text-decoration:none;">gosmartmis.rw</a>
    </p>
  </div>

</div>
</body>
</html>`

    const emailResult = await sendWelcomeEmailViaResend({
      apiKey: resendKey,
      to: director_email.trim(),
      fullName: director_name.trim(),
      roleLabel: 'director',
      schoolName: school_name.trim(),
      loginUrl,
      loginCredential: director_email.trim(),
      tempPassword,
      resetLink,
    })
    emailSent = emailResult.sent
    emailError = emailResult.error
  } else {
    emailError = 'RESEND_API_KEY is not configured.'
  }

  return json({
    success: true,
    school_id: school.id,
    school_name: school.name,
    school_url: `https://${cleanSlug}.gosmartmis.rw`,
    slug: cleanSlug,
    director_email: director_email.trim(),
    temp_password: tempPassword,
    reset_link: resetLink,
    trial_expiry: expiryDate,
    email_sent: emailSent,
    email_error: emailError,
    user_already_existed: userAlreadyExisted,
    normalized_plan: normalizedPlan,
  })
})
