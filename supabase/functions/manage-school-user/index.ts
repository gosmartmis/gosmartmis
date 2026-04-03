import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MANAGEABLE_ROLES = ['director', 'dean', 'registrar', 'accountant', 'teacher', 'student']

async function generateRegNumber(adminClient: any, schoolId: string) {
  const { data: school } = await adminClient.from('schools').select('reg_number_prefix, reg_number_padding, reg_number_counter, reg_number_year_reset, slug').eq('id', schoolId).maybeSingle()
  if (!school || !school.reg_number_prefix || school.reg_number_prefix.trim() === '') return null
  const prefix = school.reg_number_prefix.trim().toUpperCase()
  const padding = school.reg_number_padding ?? 3
  const year = new Date().getFullYear()
  const { data: updated } = await adminClient.from('schools').update({ reg_number_counter: (school.reg_number_counter ?? 0) + 1 }).eq('id', schoolId).select('reg_number_counter').maybeSingle()
  const counter = updated?.reg_number_counter ?? (school.reg_number_counter ?? 0) + 1
  const padded = String(counter).padStart(padding, '0')
  const reg_number = `${prefix}${padded}/${year}`
  const slug = school.slug || schoolId.slice(0, 8)
  const emailPart = reg_number.replace('/', '-').toLowerCase()
  return { reg_number, synthetic_email: `${emailPart}@${slug}.gosmart`, school_slug: slug }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const callerClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: req.headers.get('Authorization')! } } })
    const { data: { user } } = await callerClient.auth.getUser()
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    const { data: callerProfile } = await callerClient.from('profiles').select('role, full_name, email, school_id').eq('id', user.id).maybeSingle()
    const callerRole = callerProfile?.role ?? ''
    const isAdmin = callerRole === 'super-admin'
    const isDirector = callerRole === 'director'
    const isRegistrar = callerRole === 'registrar'

    // Allow super-admin, director, or registrar (registrar limited to student creation only)
    if (!isAdmin && !isDirector && !isRegistrar) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const adminClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
    const body = await req.json()
    const { action, school_id, school_name, school_slug, director_name, director_email, user_id, target_role } = body

    if (isDirector) {
      const dirSchoolId = callerProfile?.school_id
      if (!dirSchoolId) return new Response(JSON.stringify({ error: 'Director has no school assigned' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      if (school_id && school_id !== dirSchoolId) return new Response(JSON.stringify({ error: 'Forbidden: cannot manage users outside your school' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      if (target_role === 'director' || target_role === 'super-admin') return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      if (user_id) {
        const { data: tp } = await adminClient.from('profiles').select('school_id, role').eq('id', user_id).maybeSingle()
        if (tp?.school_id !== dirSchoolId) return new Response(JSON.stringify({ error: 'Forbidden: different school' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        if (tp?.role === 'director' || tp?.role === 'super-admin') return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    // Registrar: can only create student accounts in their own school
    if (isRegistrar) {
      const regSchoolId = callerProfile?.school_id
      if (!regSchoolId) return new Response(JSON.stringify({ error: 'Registrar has no school assigned' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      if (school_id && school_id !== regSchoolId) return new Response(JSON.stringify({ error: 'Forbidden: cannot manage users outside your school' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      if (action !== 'create') return new Response(JSON.stringify({ error: 'Registrar can only create accounts' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      if (target_role && target_role !== 'student') return new Response(JSON.stringify({ error: 'Registrar can only create student accounts' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const genPassword = () => { const c = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'; return 'GoSmart@' + Array.from({ length: 8 }, () => c[Math.floor(Math.random() * c.length)]).join('') }
    const getActionType = (base: string) => (isAdmin && target_role === 'director') ? `director_${base}` : `user_${base}`
    const resolvedSchoolId = school_id ?? (isDirector || isRegistrar ? callerProfile?.school_id : null)

    const writeAuditLog = async (opts: any) => {
      try {
        await adminClient.from('audit_logs').insert({ admin_id: user.id, admin_email: callerProfile?.email ?? user.email, admin_name: callerProfile?.full_name ?? null, action_type: opts.actionType, target_user_id: opts.targetUserId ?? null, target_email: opts.targetEmail ?? null, target_name: opts.targetName ?? null, school_id: opts.schoolId ?? (isDirector || isRegistrar ? callerProfile?.school_id : null), school_name: opts.schoolName ?? null, details: opts.details ?? {}, status: opts.status ?? 'success', performed_by_role: callerRole, target_role: opts.targetRole ?? target_role ?? null })
      } catch (e) { console.error('audit log failed:', e) }
    }

    // ── CREATE ───────────────────────────────────────────────────────────────
    if (action === 'create') {
      if (!resolvedSchoolId) return new Response(JSON.stringify({ error: 'school_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      const roleToCreate = target_role ?? (isRegistrar ? 'student' : 'director')
      if (!MANAGEABLE_ROLES.includes(roleToCreate)) return new Response(JSON.stringify({ error: `Invalid role: ${roleToCreate}` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      const isStudent = roleToCreate === 'student'
      let regNumber: string | null = null
      let authEmail = director_email?.trim()
      let isSyntheticEmail = false
      let resolvedSlug = school_slug || ''

      if (isStudent) {
        const regResult = await generateRegNumber(adminClient, resolvedSchoolId)
        if (regResult) {
          regNumber = regResult.reg_number
          resolvedSlug = resolvedSlug || regResult.school_slug
          if (!authEmail) { authEmail = regResult.synthetic_email; isSyntheticEmail = true }
        }
        if (!authEmail) return new Response(JSON.stringify({ error: 'Provide email or configure registration number prefix in Registration Settings' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      } else {
        if (!authEmail) return new Response(JSON.stringify({ error: 'director_email required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      const tempPassword = genPassword()
      let newUserId: string | null = null
      let alreadyExisted = false

      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({ email: authEmail, password: tempPassword, email_confirm: true, user_metadata: { full_name: director_name || 'School User' } })
      if (authError) {
        if (authError.message.includes('already been registered') || authError.message.includes('already exists')) {
          const { data: listData } = await adminClient.auth.admin.listUsers()
          const existing = listData?.users?.find((u: any) => u.email?.toLowerCase() === authEmail?.toLowerCase())
          newUserId = existing?.id ?? null
          alreadyExisted = true
        } else {
          await writeAuditLog({ actionType: getActionType('created'), targetEmail: authEmail, targetName: director_name, targetRole: roleToCreate, schoolId: resolvedSchoolId, schoolName: school_name, details: { error: authError.message }, status: 'error' })
          return new Response(JSON.stringify({ error: authError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
      } else {
        newUserId = authData.user?.id ?? null
      }

      if (newUserId) {
        const profileData: Record<string, unknown> = {
          id: newUserId, school_id: resolvedSchoolId, full_name: director_name || 'School User',
          email: authEmail, role: roleToCreate, is_active: true,
          must_change_password: !alreadyExisted,
        }
        if (regNumber) profileData.registration_number = regNumber
        await adminClient.from('profiles').upsert(profileData, { onConflict: 'id' })
      }

      let resetLink = ''
      if (newUserId && resolvedSlug && !isSyntheticEmail) {
        const { data: linkData } = await adminClient.auth.admin.generateLink({ type: 'recovery', email: authEmail, options: { redirectTo: `https://${resolvedSlug}.gosmartmis.rw/login` } })
        resetLink = linkData?.properties?.action_link ?? ''
      }

      await writeAuditLog({ actionType: getActionType('created'), targetUserId: newUserId, targetEmail: director_email || authEmail, targetName: director_name || 'School User', targetRole: roleToCreate, schoolId: resolvedSchoolId, schoolName: school_name, details: { user_already_existed: alreadyExisted, reset_link_generated: !!resetLink, role: roleToCreate, registration_number: regNumber, is_synthetic_email: isSyntheticEmail } })

      return new Response(JSON.stringify({ success: true, action: 'create', user_id: newUserId, user_created: !alreadyExisted, user_already_existed: alreadyExisted, temp_password: alreadyExisted ? null : tempPassword, reset_link: resetLink, registration_number: regNumber, login_credential: regNumber || (director_email || authEmail) }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ── RESET PASSWORD ───────────────────────────────────────────────────────
    if (action === 'reset_password') {
      if (!user_id || !director_email) return new Response(JSON.stringify({ error: 'user_id and director_email required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      const tempPassword = genPassword()
      const { error: updateError } = await adminClient.auth.admin.updateUserById(user_id, { password: tempPassword })
      if (updateError) {
        await writeAuditLog({ actionType: getActionType('reset_password'), targetUserId: user_id, targetEmail: director_email, schoolId: resolvedSchoolId, schoolName: school_name, details: { error: updateError.message }, status: 'error' })
        return new Response(JSON.stringify({ error: updateError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      await adminClient.from('profiles').update({ must_change_password: true }).eq('id', user_id)

      let resetLink = ''
      if (school_slug && director_email && !director_email.includes('gosmart')) {
        const { data: linkData } = await adminClient.auth.admin.generateLink({ type: 'recovery', email: director_email, options: { redirectTo: `https://${school_slug}.gosmartmis.rw/login` } })
        resetLink = linkData?.properties?.action_link ?? ''
      }
      await writeAuditLog({ actionType: getActionType('reset_password'), targetUserId: user_id, targetEmail: director_email, targetName: body.director_name, schoolId: resolvedSchoolId, schoolName: school_name, details: { reset_link_generated: !!resetLink } })
      return new Response(JSON.stringify({ success: true, action: 'reset_password', temp_password: tempPassword, reset_link: resetLink }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ── TOGGLE ACTIVE ────────────────────────────────────────────────────────
    if (action === 'toggle_active') {
      if (!user_id) return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      const { is_active } = body
      const newActive = !is_active
      await adminClient.from('profiles').update({ is_active: newActive }).eq('id', user_id)
      const { error: authError } = await adminClient.auth.admin.updateUserById(user_id, { ban_duration: newActive ? 'none' : '87600h' })
      if (authError) console.error('auth ban/unban error:', authError.message)
      const baseType = newActive ? 'activated' : 'deactivated'
      await writeAuditLog({ actionType: getActionType(baseType), targetUserId: user_id, targetEmail: body.director_email, targetName: body.director_name, schoolId: resolvedSchoolId, schoolName: school_name, details: { previous_state: is_active, new_state: newActive } })
      return new Response(JSON.stringify({ success: true, action: 'toggle_active', is_active: newActive }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ── DELETE ───────────────────────────────────────────────────────────────
    if (action === 'delete') {
      if (!user_id) return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      const { data: targetProfile } = await adminClient.from('profiles').select('email, full_name, school_id, role').eq('id', user_id).maybeSingle()
      await adminClient.from('profiles').delete().eq('id', user_id)
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(user_id)
      if (deleteError) {
        await writeAuditLog({ actionType: getActionType('deleted'), targetUserId: user_id, targetEmail: targetProfile?.email, targetName: targetProfile?.full_name, targetRole: targetProfile?.role, schoolId: resolvedSchoolId ?? targetProfile?.school_id, schoolName: school_name, details: { error: deleteError.message }, status: 'error' })
        return new Response(JSON.stringify({ error: deleteError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      await writeAuditLog({ actionType: getActionType('deleted'), targetUserId: user_id, targetEmail: targetProfile?.email, targetName: targetProfile?.full_name, targetRole: targetProfile?.role, schoolId: resolvedSchoolId ?? targetProfile?.school_id, schoolName: school_name, details: { school_data_preserved: true, role: targetProfile?.role } })
      return new Response(JSON.stringify({ success: true, action: 'delete', message: 'Account deleted. School data is preserved.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
