// Behavioural RLS verification for the TrashTag project (FIND-002 in
// plans/secAudit.md). RLS is the *entire* authorization boundary — the browser
// holds the anon key and writes to Postgres directly — so this script proves
// the policies actually reject cross-user writes rather than just trusting them.
//
// It signs in as two real test users with the ANON key (no service-role here —
// that would bypass RLS and defeat the test), has the poster create a throwaway
// request, then has the *other* user attempt the forbidden mutations the audit
// worried about. Under correct RLS an UPDATE filtered out by the policy returns
// no error but affects 0 rows, so every check re-reads the row to confirm the
// value did NOT change.
//
// Usage:
//   node scripts/verify-rls.mjs
//
// Requires .env with VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY and the two
// confirmed test accounts (both password Password123).
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n').filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]))

const url = env.VITE_SUPABASE_URL
const anonKey = env.VITE_SUPABASE_ANON_KEY
if (!url || !anonKey) {
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env')
  process.exit(1)
}

const POSTER = { email: 'garotag487@ocuser.com', password: 'Password123' } // Herald
const ATTACKER = { email: 'losab89483@dyleris.com', password: 'Password123' } // Carl

function client() {
  return createClient(url, anonKey, { auth: { persistSession: false } })
}

async function signIn(creds, label) {
  const c = client()
  const { data, error } = await c.auth.signInWithPassword(creds)
  if (error) {
    console.error(`Could not sign in ${label}: ${error.message}`)
    process.exit(1)
  }
  return { c, uid: data.user.id }
}

let failures = 0
function check(name, denied) {
  // `denied` = true means the forbidden write did NOT take effect (good).
  console.log(`${denied ? '  PASS' : '  FAIL'}  ${name}`)
  if (!denied) failures++
}

async function main() {
  const poster = await signIn(POSTER, 'poster')
  const attacker = await signIn(ATTACKER, 'attacker')

  // Poster creates a throwaway open request to attack.
  const { data: created, error: createErr } = await poster.c
    .from('requests')
    .insert({
      poster_id: poster.uid,
      photo_url: 'https://example.com/rls-test.jpg',
      location_lat: 14.5995,
      location_lng: 120.9842,
      location_label: 'RLS test',
      tags: ['Mixed'],
      price: 50,
      status: 'open',
    })
    .select()
    .single()

  if (createErr) {
    console.error(`Poster could not create test request (RLS too strict on INSERT?): ${createErr.message}`)
    process.exit(1)
  }
  const id = created.id
  console.log(`\nCreated throwaway request ${id} owned by poster ${poster.uid}\n`)

  async function readRow() {
    const { data } = await poster.c.from('requests').select('*').eq('id', id).single()
    return data
  }

  try {
    // 1. Attacker (not the poster) tries to mark the request paid.
    await attacker.c.from('requests').update({ status: 'paid' }).eq('id', id)
    check('attacker cannot set status=paid', (await readRow()).status !== 'paid')

    // 2. Attacker tries to rate a job they do not own.
    await attacker.c.from('requests').update({ rating: 5 }).eq('id', id)
    check('attacker cannot set rating', (await readRow()).rating == null)

    // 3. Attacker tries to mutate the price of someone else's request.
    await attacker.c.from('requests').update({ price: 9999 }).eq('id', id)
    check('attacker cannot change price', Number((await readRow()).price) === 50)

    // 4. Attacker tries to like as the poster (user_id spoof on request_likes).
    const { error: likeErr } = await attacker.c
      .from('request_likes')
      .insert({ request_id: id, user_id: poster.uid })
    const spoofPresent = !likeErr && (await poster.c
      .from('request_likes')
      .select('user_id')
      .eq('request_id', id)
      .eq('user_id', poster.uid)).data?.length
    check('attacker cannot like as another user', !spoofPresent)

    // Sanity: the legitimate owner CAN update their own request. A failure here
    // means RLS is too restrictive, not too loose — still worth surfacing.
    await poster.c.from('requests').update({ price: 75 }).eq('id', id)
    check('poster CAN update own request (not over-restricted)', Number((await readRow()).price) === 75)
  } finally {
    // Clean up regardless of outcome.
    await poster.c.from('requests').delete().eq('id', id)
    console.log(`\nCleaned up request ${id}`)
  }

  if (failures > 0) {
    console.error(`\n❌ ${failures} RLS check(s) FAILED — a forbidden write took effect. Tighten policies on project ${url.match(/\/\/([a-z0-9]+)\./)?.[1]}.`)
    process.exit(1)
  }
  console.log('\n✅ All RLS checks passed — cross-user writes are denied.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
