// Verifies the dispatch subsystem realtime channels: collector_presence,
// price_offers, and requests. Subscribes to all three and reports every
// event for a 30-second window. Drive mutations externally (go online in
// another tab, submit a counter-offer, post a request) to see events flow.
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
)
const viewer = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

const got = {
  presenceUpsert: false,
  offerInsert: false,
  offerUpdate: false,
  requestInsert: false,
  requestUpdate: false,
}

const channel = viewer
  .channel('verify-dispatch')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'collector_presence' }, (p) => {
    console.log(`EVENT collector_presence ${p.eventType}`, p.new?.collector_id, `online=${p.new?.online}`)
    got.presenceUpsert = true
  })
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'price_offers' }, (p) => {
    console.log('EVENT price_offers INSERT', p.new.id, `₱${p.new.price}`, `status=${p.new.status}`)
    got.offerInsert = true
  })
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'price_offers' }, (p) => {
    console.log('EVENT price_offers UPDATE', p.new.id, `status=${p.new.status}`)
    got.offerUpdate = true
  })
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'requests' }, (p) => {
    console.log('EVENT requests INSERT', p.new.id, `status=${p.new.status}`)
    got.requestInsert = true
  })
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'requests' }, (p) => {
    console.log('EVENT requests UPDATE', p.new.id, `status=${p.new.status}`)
    got.requestUpdate = true
  })

channel.subscribe((status) => {
  console.log('STATUS', status)
  if (status === 'SUBSCRIBED') {
    console.log('READY — waiting 30s for dispatch events…')
    console.log('  Try: go online as a collector, post a request, submit a counter-offer')
  }
})

const WINDOW_MS = 30_000
setTimeout(async () => {
  await viewer.removeChannel(channel)
  console.log('\n=== DISPATCH VERIFICATION RESULTS ===')
  console.log('collector_presence  :', got.presenceUpsert ? 'PASS' : 'FAIL (no presence events)')
  console.log('price_offers INSERT :', got.offerInsert ? 'PASS' : 'FAIL (no offer inserts)')
  console.log('price_offers UPDATE :', got.offerUpdate ? 'PASS' : 'FAIL (no offer updates)')
  console.log('requests INSERT     :', got.requestInsert ? 'PASS' : 'FAIL (no request inserts)')
  console.log('requests UPDATE     :', got.requestUpdate ? 'PASS' : 'FAIL (no request updates)')
  const allPass = Object.values(got).every(Boolean)
  console.log('OVERALL', allPass ? 'PASS' : 'FAIL')
  process.exit(allPass ? 0 : 1)
}, WINDOW_MS)
