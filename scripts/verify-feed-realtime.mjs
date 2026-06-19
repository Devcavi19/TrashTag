// Verifies Phase 8 Social Feed realtime sync the way the app receives it.
// A "viewer" anon client subscribes to the same channel events as useFeed.js,
// while an authenticated "actor" client drives the mutations (insert post,
// like, unlike, delete) — proving cross-tab/cross-device live feed updates.
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
)

const viewer = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)
const actor = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

const ACTOR_EMAIL = 'garotag487@ocuser.com' // Herald
const ACTOR_PASSWORD = 'Password123'

const got = { postInsert: false, likeInsert: false, likeDelete: false, postDelete: false }
let postId = null

const channel = viewer
  .channel('verify-feed')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (p) => {
    console.log('EVENT posts INSERT', p.new.id); got.postInsert = true
  })
  .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, (p) => {
    console.log('EVENT posts DELETE', p.old.id); got.postDelete = true
  })
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'post_likes' }, (p) => {
    console.log('EVENT post_likes INSERT', p.new.post_id); got.likeInsert = true
  })
  .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'post_likes' }, (p) => {
    console.log('EVENT post_likes DELETE', p.old.post_id); got.likeDelete = true
  })

channel.subscribe(async (status) => {
  console.log('STATUS', status)
  if (status !== 'SUBSCRIBED') return
  console.log('READY — driving mutations')

  const { data: auth, error: authErr } = await actor.auth.signInWithPassword({
    email: ACTOR_EMAIL, password: ACTOR_PASSWORD,
  })
  if (authErr) { console.error('AUTH FAIL', authErr.message); process.exit(1) }
  const uid = auth.user.id

  const { data: inserted, error: insErr } = await actor
    .from('posts')
    .insert({ author_id: uid, type: 'post', title: 'Realtime test', body: 'verify-feed-realtime' })
    .select('id').single()
  if (insErr) { console.error('INSERT FAIL', insErr.message); process.exit(1) }
  postId = inserted.id

  await new Promise((r) => setTimeout(r, 1500))
  await actor.from('post_likes').insert({ post_id: postId, user_id: uid })
  await new Promise((r) => setTimeout(r, 1500))
  await actor.from('post_likes').delete().eq('post_id', postId).eq('user_id', uid)
  await new Promise((r) => setTimeout(r, 1500))
  await actor.from('posts').delete().eq('id', postId) // cleanup test row
})

setTimeout(async () => {
  if (postId) await actor.from('posts').delete().eq('id', postId)
  await viewer.removeChannel(channel)
  console.log('=== RESULTS ===')
  console.log('posts INSERT      :', got.postInsert ? 'PASS' : 'FAIL')
  console.log('post_likes INSERT :', got.likeInsert ? 'PASS' : 'FAIL')
  console.log('post_likes DELETE :', got.likeDelete ? 'PASS' : 'FAIL')
  console.log('posts DELETE      :', got.postDelete ? 'PASS' : 'FAIL')
  const allPass = Object.values(got).every(Boolean)
  console.log('OVERALL', allPass ? 'PASS' : 'FAIL')
  process.exit(allPass ? 0 : 1)
}, 12000)
