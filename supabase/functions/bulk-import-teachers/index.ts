import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { generateDefaultPassword, toStudentInternalEmail } from '../_shared/onboarding.ts'

declare const Deno: {
  env: { get: (key: string) => string | undefined }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function fetchSchoolRegConfig(adminClient: any, schoolId: string) {
  const { data } = await adminClient.from('schools').select('reg_number_prefix, reg_number_padding, reg_number_counter, slug').eq('id', schoolId).maybeSingle()
  return data
}

async function bulkGenerateRegNumbers(adminClient: any, schoolId: string, count: number) {
  const { data, error } = await adminClient.rpc('next_registration_numbers', {
    p_school_id: schoolId,
    p_count: count,
  })
  if (error || !Array.isArray(data)) return []
  return data
}

async function ensureNoCrossTenantReassignment(adminClient: any, userId: string, schoolId: string) {
  const { data: existingProfile } = await adminClient
    .from('profiles')
    .select('school_id')
    .eq('id', userId)
    .maybeSingle()

  if (existingProfile?.school_id && existingProfile.school_id !== schoolId) {
    throw new Error('Cross-tenant user reassignment is blocked')
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const callerClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: req.headers.get('Authorization')! } } })
    const { data: { user } } = await callerClient.auth.getUser()
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    const { data: callerProfile } = await callerClient.from('profiles').select('role, school_id, full_name, email').eq('id', user.id).maybeSingle()
    const allowedRoles = ['registrar', 'director', 'school_manager', 'super-admin']
    if (!callerProfile || !allowedRoles.includes(callerProfile.role)) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const adminClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
    const body = await req.json()
    const { school_id, role, users } = body
    const usersArray = users || body.teachers
    const IMPORTABLE_ROLES = ['teacher', 'student', 'dean', 'registrar', 'accountant']

    if (!school_id || !Array.isArray(usersArray) || usersArray.length === 0) return new Response(JSON.stringify({ error: 'school_id and users array are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    const targetRole = role || 'teacher'
    if (!IMPORTABLE_ROLES.includes(targetRole)) return new Response(JSON.stringify({ error: `Invalid role` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    if (usersArray.length > 300) return new Response(JSON.stringify({ error: 'Maximum 300 users per import' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    if (callerProfile.role !== 'super-admin' && callerProfile.school_id !== school_id) return new Response(JSON.stringify({ error: 'Forbidden: school mismatch' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const { data: school } = await adminClient.from('schools').select('name, slug').eq('id', school_id).maybeSingle()
    const isStudent = targetRole === 'student'
    let regNumberPool: { reg_number: string; synthetic_email: string }[] = []
    if (isStudent) regNumberPool = await bulkGenerateRegNumbers(adminClient, school_id, usersArray.length)

    const usedStudentUsernames = new Set<string>()
    if (isStudent) {
      const { data: existingProfiles } = await adminClient
        .from('profiles')
        .select('email')
        .eq('school_id', school_id)
        .like('email', '%@student.local')
      ;(existingProfiles || []).forEach((p: any) => {
        const email = String(p?.email || '').toLowerCase()
        if (email.endsWith('@student.local')) usedStudentUsernames.add(email.split('@')[0])
      })
    }

    const makeStudentUsername = (firstName: string, lastName: string) => {
      const clean = (v: string) => (v || '').toLowerCase().replace(/[^a-z0-9]+/g, '')
      let base = [clean(firstName), clean(lastName)].filter(Boolean).join('.')
      if (!base) base = `student${Math.floor(Math.random() * 10000)}`
      if (!usedStudentUsernames.has(base)) {
        usedStudentUsernames.add(base)
        return base
      }
      let i = 2
      while (i < 10000) {
        const candidate = `${base}${i}`
        if (!usedStudentUsernames.has(candidate)) {
          usedStudentUsernames.add(candidate)
          return candidate
        }
        i += 1
      }
      const fallback = `${base}${Date.now().toString().slice(-6)}`
      usedStudentUsernames.add(fallback)
      return fallback
    }

    const results: any[] = []

    for (let i = 0; i < usersArray.length; i++) {
      const entry = usersArray[i]
      const { full_name, phone } = entry
      let { email } = entry
      const rowNum = i + 1

      const firstName = (entry.firstname || entry.first_name || '').trim()
      const lastName = (entry.lastname || entry.last_name || '').trim()
      const sex = (entry.sex || '').trim()
      const className = (entry.class || entry.class_name || '').trim()
      const resolvedFullName = isStudent
        ? `${firstName} ${lastName}`.trim()
        : (full_name || '').trim()

      if (!resolvedFullName) { results.push({ row: rowNum, full_name: '', email: email || '', status: 'error', error: isStudent ? 'firstname and lastname are required' : 'full_name is required' }); continue }
      if (isStudent && !sex) { results.push({ row: rowNum, full_name: resolvedFullName, email: '', status: 'error', error: 'sex is required' }); continue }
      if (isStudent && !className) { results.push({ row: rowNum, full_name: resolvedFullName, email: '', status: 'error', error: 'class is required' }); continue }

      const regEntry = regNumberPool[i] ?? null
      const regNumber = regEntry?.reg_number ?? null
      let username: string | null = null
      if (isStudent) {
        username = makeStudentUsername(firstName, lastName)
        email = toStudentInternalEmail(username)
      }
      if (!email) { results.push({ row: rowNum, full_name: resolvedFullName, email: '', status: 'error', error: 'email is required' }); continue }
      const cleanEmail = email.trim().toLowerCase()
      const cleanName = resolvedFullName

      try {
        const tempPassword = generateDefaultPassword()
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({ email: cleanEmail, password: tempPassword, email_confirm: true, user_metadata: { full_name: cleanName } })

        if (authError) {
          if (authError.message.includes('already been registered') || authError.message.includes('already exists')) {
            const { data: existingUsers } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
            const existing = existingUsers?.users?.find((u: any) => u.email?.toLowerCase() === cleanEmail)
            if (existing) {
              await ensureNoCrossTenantReassignment(adminClient, existing.id, school_id)
              const profileData: Record<string, unknown> = { id: existing.id, school_id, full_name: cleanName, email: cleanEmail, phone: phone?.trim() || null, role: targetRole, is_active: true, must_change_password: true }
              if (regNumber) profileData.registration_number = regNumber
              await adminClient.from('profiles').upsert(profileData, { onConflict: 'id' })
            }
            results.push({ row: rowNum, full_name: cleanName, email: cleanEmail, username: username || undefined, class: className || undefined, sex: sex || undefined, registration_number: regNumber || undefined, status: 'exists', temp_password: tempPassword })
          } else {
            results.push({ row: rowNum, full_name: cleanName, email: cleanEmail, status: 'error', error: authError.message })
          }
          continue
        }

        const userId = authData.user?.id
        if (userId) {
          await ensureNoCrossTenantReassignment(adminClient, userId, school_id)
          const profileData: Record<string, unknown> = {
            id: userId, school_id, full_name: cleanName, email: cleanEmail,
            phone: phone?.trim() || null, role: targetRole, is_active: true,
            must_change_password: true,
          }
          if (regNumber) profileData.registration_number = regNumber
          await adminClient.from('profiles').upsert(profileData, { onConflict: 'id' })
        }
        results.push({ row: rowNum, full_name: cleanName, email: cleanEmail, username: username || undefined, class: className || undefined, sex: sex || undefined, registration_number: regNumber || undefined, status: 'created', temp_password: tempPassword })
      } catch (err: any) {
        results.push({ row: rowNum, full_name: entry.full_name || '', email: entry.email || '', status: 'error', error: err.message })
      }
    }

    const created = results.filter((r: any) => r.status === 'created').length
    const existed = results.filter((r: any) => r.status === 'exists').length
    const failed = results.filter((r: any) => r.status === 'error').length

    try {
      await adminClient.from('audit_logs').insert({ action: `bulk_import_${targetRole}`, performed_by: user.id, performed_by_name: callerProfile.full_name || callerProfile.email, performed_by_email: callerProfile.email, performed_by_role: callerProfile.role, target_role: targetRole, school_id, school_name: school?.name || '', details: { total: usersArray.length, created, existed, failed, role: targetRole, reg_numbers_assigned: regNumberPool.length }, status: failed === usersArray.length ? 'error' : 'success' })
    } catch (_) {}

    return new Response(JSON.stringify({ success: true, created, existed, failed, results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
