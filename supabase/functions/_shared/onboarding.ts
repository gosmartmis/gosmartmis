export function generateDefaultPassword(length = 8): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const rand = Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `GoSmart@${rand}`
}

function slugPart(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .trim()
}

export function toStudentInternalEmail(username: string): string {
  return `${username}@student.local`
}

export async function generateUniqueStudentUsername(
  adminClient: any,
  schoolId: string,
  opts: { firstName?: string; lastName?: string; fullName?: string }
): Promise<string> {
  const first = slugPart(opts.firstName || '')
  const last = slugPart(opts.lastName || '')
  const full = slugPart(opts.fullName || '')

  let base = [first, last].filter(Boolean).join('.')
  if (!base) base = full
  if (!base) base = `student${Math.floor(Math.random() * 10000)}`

  const { data: existingProfiles } = await adminClient
    .from('profiles')
    .select('email')
    .eq('school_id', schoolId)
    .like('email', '%@student.local')

  const used = new Set(
    (existingProfiles || [])
      .map((p: any) => String(p?.email || '').toLowerCase())
      .filter(Boolean)
      .map((email: string) => email.split('@')[0])
  )

  if (!used.has(base)) return base

  let i = 2
  while (i < 10000) {
    const candidate = `${base}${i}`
    if (!used.has(candidate)) return candidate
    i += 1
  }

  return `${base}${Date.now().toString().slice(-6)}`
}

export async function sendWelcomeEmailViaResend(params: {
  apiKey: string | undefined
  to: string
  fullName: string
  roleLabel: string
  schoolName: string
  loginUrl: string
  loginCredential: string
  tempPassword: string
  resetLink?: string
}) {
  if (!params.apiKey) return { sent: false, error: 'RESEND_API_KEY is not configured.' }

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:20px;border:1px solid #e5e7eb;border-radius:12px;">
      <h2 style="margin:0 0 8px;color:#0f172a;">Welcome to GoSmart MIS</h2>
      <p style="margin:0 0 14px;color:#334155;">Hi ${params.fullName}, your ${params.roleLabel} account has been prepared for ${params.schoolName}.</p>
      <p style="margin:0 0 8px;color:#334155;"><strong>Portal:</strong> <a href="${params.loginUrl}">${params.loginUrl}</a></p>
      <p style="margin:0 0 8px;color:#334155;"><strong>Login credential:</strong> ${params.loginCredential}</p>
      <p style="margin:0 0 8px;color:#334155;"><strong>Temporary password:</strong> <code style="background:#fef3c7;padding:3px 6px;border-radius:6px;">${params.tempPassword}</code></p>
      ${params.resetLink ? `<p style="margin:14px 0 0;"><a href="${params.resetLink}" style="display:inline-block;background:#0d9488;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none;">Set your password</a></p>` : ''}
    </div>
  `

  try {
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${params.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'GoSmart MIS <onboarding@gosmartmis.rw>',
        to: [params.to],
        subject: `${params.schoolName} account onboarding`,
        html,
      }),
    })

    if (emailRes.ok) return { sent: true, error: null }
    return { sent: false, error: `Resend API error: ${await emailRes.text()}` }
  } catch (err: any) {
    return { sent: false, error: err?.message || 'Failed to send welcome email' }
  }
}
