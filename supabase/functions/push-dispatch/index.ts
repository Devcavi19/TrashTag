import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'https://esm.sh/web-push@3.6.6'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

// Distance in km
function haversineDist(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

webpush.setVapidDetails(
  'mailto:contact@kolek.app',
  Deno.env.get('VITE_VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!
)

serve(async (req) => {
  try {
    const payload = await req.json()
    const record = payload.record

    if (!record || !record.location_lat || !record.location_lng) {
      return new Response('Missing location', { status: 400 })
    }

    // Get online collectors with push subscriptions
    const { data: presences } = await supabase
      .from('collector_presence')
      .select('collector_id, lat, lng, push_subscriptions(endpoint, p256dh, auth)')
      .eq('online', true)
      .neq('collector_id', record.poster_id)

    if (!presences || presences.length === 0) {
      return new Response('No online collectors', { status: 200 })
    }

    const promises = []
    
    for (const presence of presences) {
      if (!presence.lat || !presence.lng || !presence.push_subscriptions) continue
      
      const subs = Array.isArray(presence.push_subscriptions) ? presence.push_subscriptions : [presence.push_subscriptions]
      if (subs.length === 0) continue
      
      const dist = haversineDist(record.location_lat, record.location_lng, presence.lat, presence.lng)
      if (dist <= 5) {
        const distanceStr = dist < 1 ? Math.round(dist * 1000) + 'm' : dist.toFixed(1) + 'km'
        const payloadString = JSON.stringify({
          title: 'New Pickup Available',
          body: `₱${record.price} — ${distanceStr} away`,
          url: '/'
        })

        for (const sub of subs) {
          if (!sub.endpoint) continue
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          }
          promises.push(
            webpush.sendNotification(pushSubscription, payloadString).catch(e => {
              console.error('Error sending push to', sub.endpoint, e)
            })
          )
        }
      }
    }

    await Promise.allSettled(promises)
    return new Response(JSON.stringify({ success: true, notifiedCount: promises.length }), { headers: { 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error('Error in push-dispatch:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})
