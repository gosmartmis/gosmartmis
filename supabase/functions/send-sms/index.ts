import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SMSPayload {
  to: string
  message: string
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

    const payload: SMSPayload = await req.json()
    
    // Get SMS settings from database
    const { data: settings, error: settingsError } = await supabaseClient
      .from('sms_settings')
      .select('*')
      .eq('is_active', true)
      .single()

    if (settingsError || !settings) {
      return new Response(JSON.stringify({ 
        error: 'SMS settings not configured',
        details: settingsError?.message 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // For now, return mock success response
    // In production, integrate with actual SMS provider (Twilio, Nexmo, Plivo, etc.)
    const smsResult = {
      success: true,
      messageId: `mock-sms-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      to: payload.to,
      message: payload.message,
      sent_at: new Date().toISOString()
    }

    // Log the SMS
    if (payload.notificationId) {
      await supabaseClient.from('notification_logs').insert({
        notification_id: payload.notificationId,
        channel: 'sms',
        status: 'sent',
        recipient: payload.to,
        content: payload.message,
        external_id: smsResult.messageId,
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

    return new Response(JSON.stringify(smsResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})