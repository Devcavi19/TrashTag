// Verifies Phase 7 chat real-time delivery the way ChatDrawer.jsx does:
// two AUTHENTICATED clients (poster + collector) each subscribe to the
// messages channel for a request and insert a message. Each must receive the
// other's message live via Realtime — through the same RLS the app enforces.
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n').filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
)
const URL_ = env.VITE_SUPABASE_URL
const KEY = env.VITE_SUPABASE_ANON_KEY

const REQUEST_ID = 'de8b05fe-ae6f-4b9a-b83b-72f8a21220c5' // Carl=poster, Herald=collector
const POSTER = { email: 'losab89483@dyleris.com', password: 'Password123', label: 'poster(Carl)' }
const COLLECTOR = { email: 'garotag487@ocuser.com', password: 'Password123', label: 'collector(Herald)' }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function makeClient(creds) {
  const c = createClient(URL_, KEY)
  const { data, error } = await c.auth.signInWithPassword({ email: creds.email, password: creds.password })
  if (error) throw new Error(`${creds.label} login failed: ${error.message}`)
  return { c, uid: data.user.id }
}

async function subscribe(client, received) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('subscribe timeout')), 10000)
    const ch = client
      .channel(`messages:${REQUEST_ID}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `request_id=eq.${REQUEST_ID}` },
        (p) => received.push(p.new))
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') { clearTimeout(t); resolve(ch) }
      })
    return ch
  })
}

const poster = await makeClient(POSTER)
const collector = await makeClient(COLLECTOR)
console.log('logged in:', POSTER.label, poster.uid, '|', COLLECTOR.label, collector.uid)

const posterGot = []
const collectorGot = []
await subscribe(poster.c, posterGot)
await subscribe(collector.c, collectorGot)
console.log('both subscribed to messages:' + REQUEST_ID)

console.log('\nposter sends ->')
await poster.c.from('messages').insert({ request_id: REQUEST_ID, sender_id: poster.uid, text: 'Hi, are you on the way?' })
await sleep(2500)

console.log('collector sends ->')
await collector.c.from('messages').insert({ request_id: REQUEST_ID, sender_id: collector.uid, text: 'Yes! 5 minutes away.' })
await sleep(2500)

const collectorGotPoster = collectorGot.some((m) => m.sender_id === poster.uid && /on the way/.test(m.text))
const posterGotCollector = posterGot.some((m) => m.sender_id === collector.uid && /5 minutes/.test(m.text))

console.log('\n=== RESULTS ===')
console.log('collector received poster message :', collectorGotPoster ? 'PASS' : 'FAIL')
console.log('poster received collector message :', posterGotCollector ? 'PASS' : 'FAIL')

console.log('\ncleanup: deleting test messages')
await poster.c.from('messages').delete().eq('request_id', REQUEST_ID).eq('sender_id', poster.uid)
await collector.c.from('messages').delete().eq('request_id', REQUEST_ID).eq('sender_id', collector.uid)

const pass = collectorGotPoster && posterGotCollector
console.log('\nOVERALL', pass ? 'PASS — bidirectional real-time chat works' : 'FAIL')
process.exit(pass ? 0 : 1)
