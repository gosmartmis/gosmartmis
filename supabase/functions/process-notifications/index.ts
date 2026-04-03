import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// This function can be called by a cron job to process scheduled notifications
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const now = new Date().toISOString()

    // Get pending notifications that are due
    const { data: pendingNotifications, error: fetchError } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .in('status', ['pending', 'scheduled'])
      .lte('scheduled_at', now)
      .order('created_at', { ascending: true })
      .limit(100)

    if (fetchError) {
      throw new Error(`Failed to fetch notifications: ${fetchError.message}`)
    }

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (const notification of pendingNotifications || []) {
      results.processed++
      
      try {
        // Determine which channel(s) to use
        const channels = notification.channel === 'both' 
          ? ['email', 'sms'] 
          : [notification.channel]

        for (const channel of channels) {
          if (channel === 'email' && notification.parent_email) {
            // Call send-email function
            await supabaseAdmin.functions.invoke('send-email', {
              body: {
                to: notification.parent_email,
                toName: notification.parent_name,
                subject: notification.subject,
                body: notification.message,
                notificationId: notification.id
              }
            })
          } else if (channel === 'sms' && notification.parent_phone) {
            // Call send-sms function
            await supabaseAdmin.functions.invoke('send-sms', {
              body: {
                to: notification.parent_phone,
                message: notification.message,
                notificationId: notification.id
              }
            })
          }
        }

        results.succeeded++

      } catch (error) {
        results.failed++
        results.errors.push(`Notification ${notification.id}: ${error.message}`)
        
        // Update notification with error and increment retry count
        await supabaseAdmin
          .from('notifications')
          .update({
            status: 'failed',
            error_message: error.message,
            retry_count: notification.retry_count + 1,
            updated_at: now
          })
          .eq('id', notification.id)
      }
    }

    // Run automation rules
    await processAutomationRules(supabaseAdmin)

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function processAutomationRules(supabaseAdmin: any) {
  const now = new Date()
  
  // Get active automation rules that are due to run
  const { data: rules, error } = await supabaseAdmin
    .from('automation_rules')
    .select('*, template:template_id(*)')
    .eq('is_active', true)
    .or(`next_run_at.lte.${now.toISOString()},next_run_at.is.null`)

  if (error || !rules) return

  for (const rule of rules) {
    const condition = rule.trigger_condition
    
    if (condition.condition === 'missing_documents' && condition.days_after) {
      // Find students with missing documents for X days
      const cutoffDate = new Date(now)
      cutoffDate.setDate(cutoffDate.getDate() - condition.days_after)
      
      // This is a placeholder - in production, you'd query your actual student/documents tables
      // For now, we'll just update the rule's last run time
    }

    // Update rule run times
    const nextRun = new Date(now)
    nextRun.setDate(nextRun.getDate() + 1) // Run daily

    await supabaseAdmin
      .from('automation_rules')
      .update({
        last_run_at: now.toISOString(),
        next_run_at: nextRun.toISOString(),
        run_count: (rule.run_count || 0) + 1
      })
      .eq('id', rule.id)
  }
}