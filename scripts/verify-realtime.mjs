// Verifies Phase 4 realtime sync the way the app receives it:
// an anon "viewer" client subscribes to the same channel as useRequests.js and
// reports every realtime event for a fixed window. DB mutations are driven
// externally (another user/tab), proving cross-tab/cross-device live sync.
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
)
const viewer = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

const got = { insert: false, update: false, likeInsert: false, likeDelete: false }

const channel = viewer
  .channel('verify')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'requests' }, (p) => {
    console.log('EVENT requests INSERT', p.new.id); got.insert = true
  })
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'requests' }, (p) => {
    console.log('EVENT requests UPDATE', p.new.id, '->', p.new.status); got.update = true
  })
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'request_likes' }, (p) => {
    console.log('EVENT request_likes INSERT', p.new.request_id); got.likeInsert = true
  })
  .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'request_likes' }, (p) => {
    console.log('EVENT request_likes DELETE', p.old.request_id); got.likeDelete = true
  })

channel.subscribe((status) => {
  console.log('STATUS', status)
  if (status === 'SUBSCRIBED') console.log('READY')
})

const WINDOW_MS = 30000
setTimeout(async () => {
  await viewer.removeChannel(channel)
  console.log('=== RESULTS ===')
  console.log('requests INSERT      :', got.insert ? 'PASS' : 'FAIL')
  console.log('requests UPDATE      :', got.update ? 'PASS' : 'FAIL')
  console.log('request_likes INSERT :', got.likeInsert ? 'PASS' : 'FAIL')
  console.log('request_likes DELETE :', got.likeDelete ? 'PASS' : 'FAIL')
  const allPass = Object.values(got).every(Boolean)
  console.log('OVERALL', allPass ? 'PASS' : 'FAIL')
  process.exit(allPass ? 0 : 1)
}, WINDOW_MS)
