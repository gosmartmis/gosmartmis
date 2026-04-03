import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailPayload {
  to: string
  toName?: string
  subject: string
  body: string
  html?: string
  notificationId?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const payload: EmailPayload = await req.json()
    
    // Get email settings from database
    const { data: settings, error: settingsError } = await supabaseClient
      .from('email_settings')
      .select('*')
      .eq('is_active', true)
      .single()

    if (settingsError || !settings) {
      return new Response(JSON.stringify({ 
        error: 'Email settings not configured',
        details: settingsError?.message 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // For now, return mock success response
    // In production, integrate with actual email provider (SendGrid, Resend, Mailgun, etc.)
    const emailResult = {
      success: true,
      messageId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      to: payload.to,
      subject: payload.subject,
      sent_at: new Date().toISOString()
    }

    // Log the email
    if (payload.notificationId) {
      await supabaseClient.from('notification_logs').insert({
        notification_id: payload.notificationId,
        channel: 'email',
        status: 'sent',
        recipient: payload.to,
        subject: payload.subject,
        content: payload.body,
        external_id: emailResult.messageId,
        sent_at: new Date().toISOString()
      })

      // Update notification status
      await supabaseClient
        .from('notifications')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', payload.notificationId)
    }

    return new Response(JSON.stringify(emailResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})