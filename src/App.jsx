import { useState, useEffect, useRef } from 'react'
import ngeohash from 'ngeohash'
import { useRequests } from './hooks/useRequests'
import { useFeed } from './hooks/useFeed'
import { useIdleLogout } from './hooks/useIdleLogout'
import { supabase } from './lib/supabase'
import { validateImage } from './lib/validateImage'
import { prefsOf } from './lib/notificationPrefs'
import { deriveCredential } from './lib/collectorCred'
import { haversineDistance } from './utils/haversine'
import { useViewerLocation } from './hooks/useViewerLocation'
import { useNearbyPresence } from './hooks/useNearbyPresence'
import { useOffers } from './hooks/useOffers'
import { urlBase64ToUint8Array } from './utils/push'
import DispatchHome from './components/DispatchHome'
import FeedView from './components/FeedView'
import LeaderboardView from './components/LeaderboardView'
import ProfileView from './components/ProfileView'
import Conversations from './components/Conversations'
import MessageThread from './components/MessageThread'
import ComposerModal from './components/ComposerModal'
import TopBar from './components/TopBar'
import BottomNav from './components/BottomNav'
import LoadingScreen from './components/LoadingScreen'
import AuthScreen from './components/AuthScreen'
import Landing from './components/Landing'
import Toast from './components/Toast'
import DispatchRadar from './components/DispatchRadar'
import IncomingOffer from './components/IncomingOffer'

function App() {
  const [appState, setAppState] = useState('loading') // 'loading' | 'auth' | 'app'
  const [currentUser, setCurrentUser] = useState(null)
  const [profiles, setProfiles] = useState([])

  const [view, setView] = useState('home') // 'home' | 'community' | 'leaderboard' | 'you'
  const [messagesOpen, setMessagesOpen] = useState(false)
  const [activeThreadPeer, setActiveThreadPeer] = useState(null)
  const [composerOpen, setComposerOpen] = useState(false)
  const [notice, setNotice] = useState(null)
  const [authNotice, setAuthNotice] = useState(null)
  // Signed-out visitors see the landing page; the auth form is reached via its
  // CTAs (or directly after an explicit sign-out, when they already know the app).
  const [authView, setAuthView] = useState('landing') // 'landing' | 'form'
  const [authMode, setAuthMode] = useState('login') // initial tab for AuthScreen

  const [requests, realtimeStatus] = useRequests()
  const [posts] = useFeed()
  const { location } = useViewerLocation()
  const homeCollectors = useNearbyPresence(location?.lat ?? null, location?.lng ?? null)

  const [activeDispatchRequestId, setActiveDispatchRequestId] = useState(null)
  const [incomingOfferReqId, setIncomingOfferReqId] = useState(null)
  const [online, setOnline] = useState(false)

  const radarRequest = activeDispatchRequestId ? requests.find((r) => r.id === activeDispatchRequestId) : null
  const radarOffers = useOffers(activeDispatchRequestId)
  const radarCollectors = useNearbyPresence(radarRequest?.lat ?? null, radarRequest?.lng ?? null)

  const realtimeDown = realtimeStatus === 'CHANNEL_ERROR' || realtimeStatus === 'TIMED_OUT'

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, gcash_number, maya_number, verified_at, avatar_url, created_at, notification_prefs')
      .eq('id', userId)
      .single()
    return data
  }

  async function fetchAllProfiles() {
    const { data } = await supabase.from('profiles').select('id, name, gcash_number, maya_number, verified_at, avatar_url, created_at, notification_prefs')
    if (data) setProfiles(data)
  }

  // Auto-dismiss transient menu notices
  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(null), 2600)
    return () => clearTimeout(t)
  }, [notice])

  // The dispatch home needs the map immediately — warm the Leaflet chunk.
  useEffect(() => {
    import('./components/DispatchMap')
  }, [])

  // Listen for auth state changes — only act on explicit sign-out
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null)
        setProfiles([])
        setAppState('auth')
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  // Called when the splash animation finishes — check for an existing session
  async function handleLoadingDone() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      const profile = await fetchProfile(session.user.id)
      setCurrentUser({ ...session.user, name: profile?.name })
      await fetchAllProfiles()
      setAppState('app')
    } else {
      setAppState('auth')
    }
  }

  async function handleLogin(authUser) {
    setAuthNotice(null)
    const profile = await fetchProfile(authUser.id)
    setCurrentUser({ ...authUser, name: profile?.name })
    await fetchAllProfiles()
    setAppState('app')
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setCurrentUser(null)
    setProfiles([])
    setAuthView('form')
    setAuthMode('login')
    setAppState('auth')
  }

  // Auto sign-out after 10 minutes of inactivity while signed in.
  async function handleIdleLogout() {
    setAuthNotice('You were signed out after 10 minutes of inactivity.')
    await handleLogout()
  }
  useIdleLogout(appState === 'app', handleIdleLogout)

  useEffect(() => {
    if (!currentUser?.id) return
    let interval
    if (online) {
      const updatePresence = async () => {
        const lat = location?.lat || 0
        const lng = location?.lng || 0
        await supabase.from('collector_presence').upsert({
          collector_id: currentUser.id, lat, lng, online: true, updated_at: new Date().toISOString()
        })
      }
      updatePresence()
      interval = setInterval(updatePresence, 30000)

      if ('serviceWorker' in navigator && 'PushManager' in window) {
        navigator.serviceWorker.ready.then(async (registration) => {
          try {
            let subscription = await registration.pushManager.getSubscription()
            if (!subscription) {
              const permission = await Notification.requestPermission()
              if (permission === 'granted') {
                const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
                subscription = await registration.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: urlBase64ToUint8Array(publicKey)
                })
              }
            }
            if (subscription) {
              const subJSON = subscription.toJSON()
              await supabase.from('push_subscriptions').upsert({
                user_id: currentUser.id,
                endpoint: subJSON.endpoint,
                p256dh: subJSON.keys.p256dh,
                auth: subJSON.keys.auth
              }, { onConflict: 'endpoint' })
            }
          } catch (e) {
            console.error('Push subscription failed:', e)
          }
        })
      }
    } else {
      supabase.from('collector_presence').update({ online: false }).eq('collector_id', currentUser.id).then()
    }
    return () => clearInterval(interval)
  }, [online, currentUser?.id, location])

  useEffect(() => {
    return () => {
      if (currentUser?.id) supabase.from('collector_presence').update({ online: false }).eq('collector_id', currentUser.id).then()
    }
  }, [currentUser?.id])

  useEffect(() => {
    if (!online || !location || !currentUser?.id) return
    const channel = supabase.channel('incoming-requests')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'requests' }, (payload) => {
        const req = payload.new
        if (req.status !== 'open' || req.poster_id === currentUser.id) return
        if (req.location_lat != null && req.location_lng != null) {
          const dist = haversineDistance(location.lat, location.lng, req.location_lat, req.location_lng)
          if (dist <= 5000) {
            const passed = JSON.parse(localStorage.getItem('passed_requests') || '[]')
            if (!passed.includes(req.id)) {
              setIncomingOfferReqId(req.id)
            }
          }
        }
      }).subscribe()
    return () => supabase.removeChannel(channel)
  }, [online, location, currentUser?.id])

  useEffect(() => {
    if (radarRequest && radarRequest.status === 'accepted') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveDispatchRequestId(null)
      openThread(radarRequest)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requests, activeDispatchRequestId])

  async function addRequest(newReq) {
    const geohash =
      newReq.lat != null && newReq.lng != null
        ? ngeohash.encode(newReq.lat, newReq.lng, 9)
        : null
    const { data } = await supabase.from('requests').insert({
      poster_id: currentUser?.id,
      photo_url: newReq.photo,
      location_label: newReq.label,
      location_lat: newReq.lat,
      location_lng: newReq.lng,
      location_geohash: geohash,
      tags: newReq.tags,
      price: newReq.price,
      status: 'open',
    }).select().single()
    if (data) setActiveDispatchRequestId(data.id)
    setComposerOpen(false)
  }

  async function updateStatus(id, newStatus) {
    if (newStatus === 'accepted') {
      const { data } = await supabase.from('requests')
        .update({ status: 'accepted', collected_by: currentUser?.id })
        .eq('id', id)
        .eq('status', 'open')
        .select()
      
      if (!data || data.length === 0) {
        setNotice("Another collector got this one.")
      }
      if (incomingOfferReqId === id) setIncomingOfferReqId(null)
    } else {
      const updates = { status: newStatus }
      await supabase.from('requests').update(updates).eq('id', id)
    }
  }

  async function submitPriceOffer(requestId, price) {
    await supabase.from('price_offers').insert({
      request_id: requestId,
      collector_id: currentUser?.id,
      price: price
    })
    setIncomingOfferReqId(null)
    setNotice('Offer sent to the poster.')
  }

  async function acceptPriceOffer(offerId) {
    const { error } = await supabase.rpc('accept_price_offer', { offer_id: offerId })
    if (error) setNotice('Could not accept offer: ' + error.message)
  }

  async function declinePriceOffer(offerId) {
    await supabase.from('price_offers').update({ status: 'declined' }).eq('id', offerId)
  }

  async function cancelRequest(id) {
    await supabase.from('requests').delete().eq('id', id)
    if (activeDispatchRequestId === id) setActiveDispatchRequestId(null)
  }

  // Poster rejects the after-photo: back to the collector for a redo.
  async function handleRejectProof(id) {
    await supabase.from('requests').update({ status: 'disputed', after_photo_url: null }).eq('id', id)
  }

  // Dual-confirmation payment handshake (money moves outside the app).
  // Poster reports the payment as sent…
  async function markPaymentSent(id, method, reference) {
    await supabase.from('requests').update({
      status: 'payment_sent',
      payment_method: method,
      payment_reference: reference?.trim() || null,
      payment_sent_at: new Date().toISOString(),
    }).eq('id', id)
  }

  // …the collector confirms it landed…
  async function confirmPaymentReceived(id) {
    await supabase.from('requests').update({
      status: 'paid',
      payment_confirmed_at: new Date().toISOString(),
    }).eq('id', id)
  }

  // …or reports it missing, which reopens the poster's pay step.
  async function reportPaymentNotReceived(id) {
    await supabase.from('requests').update({
      status: 'collected',
      payment_method: null,
      payment_reference: null,
      payment_sent_at: null,
    }).eq('id', id)
  }

  // Collector saves their receiving details (shown to posters in the pay sheet).
  async function savePaymentDetails({ gcash, maya }) {
    const myId = currentUser?.id
    if (!myId) return
    await supabase.from('profiles').update({
      gcash_number: gcash?.trim() || null,
      maya_number: maya?.trim() || null,
    }).eq('id', myId)
    await fetchAllProfiles()
    setNotice('Payment details saved.')
  }

  // --- Account settings (sheet in ProfileView) ---

  async function uploadAvatar(file) {
    const uid = currentUser?.id
    if (!uid || !file) return
    const invalid = validateImage(file)
    if (invalid) { setNotice(invalid); return }
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${uid}/${Date.now()}.${ext}`
    const { data: uploadData, error } = await supabase.storage.from('avatars').upload(path, file)
    if (error || !uploadData) { setNotice('Avatar upload failed — try again.'); return }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(uploadData.path)
    const { error: saveError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', uid)
    if (saveError) { setNotice('Could not save your avatar.'); return }
    await fetchAllProfiles()
    setNotice('Avatar updated.')
  }

  async function saveAccountName(name) {
    const uid = currentUser?.id
    const trimmed = name?.trim()
    if (!uid || !trimmed) return
    const { error } = await supabase.from('profiles').update({ name: trimmed }).eq('id', uid)
    if (error) { setNotice('Could not save your name.'); return }
    // Sign-up stores the name in auth metadata too — keep them in sync.
    await supabase.auth.updateUser({ data: { name: trimmed } })
    setCurrentUser((u) => ({ ...u, name: trimmed }))
    await fetchAllProfiles()
    setNotice('Name updated.')
  }

  async function changeEmail(email) {
    const { error } = await supabase.auth.updateUser({ email })
    if (error) { setNotice(error.message); return }
    setNotice('Check your inbox to confirm the email change.')
  }

  async function changePassword(password) {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setNotice(error.message); return }
    setNotice('Password updated.')
  }

  // Returns success so the sheet can revert its optimistic flip on failure.
  async function saveNotificationPrefs(prefs) {
    const uid = currentUser?.id
    if (!uid) return false
    const { error } = await supabase.from('profiles').update({ notification_prefs: prefs }).eq('id', uid)
    if (error) { setNotice('Could not save notification settings.'); return false }
    await fetchAllProfiles()
    return true
  }

  async function handleAfterPhoto(id, file) {
    if (!file) return
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${id}/${Date.now()}.${ext}`
    const { data: uploadData, error } = await supabase.storage
      .from('after-photos')
      .upload(path, file)
    if (error || !uploadData) return
    const { data: { publicUrl } } = supabase.storage.from('after-photos').getPublicUrl(uploadData.path)
    await supabase.from('requests').update({ after_photo_url: publicUrl }).eq('id', id)
  }

  // by: 'poster' writes requests.rating; 'collector' writes requests.collector_rating
  async function handleRate(id, stars, by) {
    const column = by === 'collector' ? 'collector_rating' : 'rating'
    await supabase.from('requests').update({ [column]: stars }).eq('id', id)
  }

  async function addPost(newPost) {
    await supabase.from('posts').insert({ ...newPost, author_id: currentUser?.id })
  }

  async function handlePostLike(postId, userId) {
    if (!userId) return
    const post = posts.find((p) => p.id === postId)
    if (!post) return
    if (post.likes.includes(userId)) {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId)
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: userId })
    }
  }

  // Jobs I'm part of that are still in motion — drives the Messages badge.
  const myId = currentUser?.id
  const myPrefs = prefsOf(profiles.find((p) => p.id === myId))

  // --- In-app alerts (gated by notification prefs) ---
  // Latest alert context in a ref so the realtime channel below never needs
  // to resubscribe when prefs, profiles, or the open thread change.
  const alertCtxRef = useRef({ prefs: myPrefs, openPeer: null, profiles: [] })
  useEffect(() => {
    alertCtxRef.current = { prefs: myPrefs, openPeer: activeThreadPeer, profiles }
  })

  // Last seen status per request, seeded fill-only from fetched state (the
  // realtime handler's own records win) — alerts fire on transitions only.
  const jobStatusRef = useRef(new Map())
  useEffect(() => {
    const seen = jobStatusRef.current
    for (const r of requests) {
      if (!seen.has(r.id)) seen.set(r.id, r.status)
    }
  }, [requests])

  useEffect(() => {
    if (!myId) return
    const channel = supabase
      .channel('app-alerts')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'requests' },
        (payload) => {
          const row = payload.new
          const before = jobStatusRef.current.get(row.id)
          jobStatusRef.current.set(row.id, row.status)
          if (!alertCtxRef.current.prefs.jobUpdates) return
          if (before === undefined || before === row.status) return
          if (row.poster_id === myId) {
            if (row.status === 'accepted') setNotice('A Green Collector accepted your pickup — say hi in Messages.')
            if (row.status === 'collected' && before === 'payment_sent') setNotice("The Green Collector hasn't received your payment — please resend.")
            else if (row.status === 'collected') setNotice('Cleanup proof uploaded — review it in Messages.')
            if (row.status === 'paid') setNotice('Payment confirmed — pickup complete. 🎉')
          }
          if (row.collected_by === myId) {
            if (row.status === 'payment_sent') setNotice('Payment sent — confirm receipt in Messages.')
            if (row.status === 'disputed') setNotice('Your cleanup proof was rejected — please re-upload.')
          }
        }
      )
      // RLS limits messages to requests I'm part of, so this table-wide
      // subscription only ever delivers my own conversations.
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const { sender_id } = payload.new
          const { prefs, openPeer, profiles: people } = alertCtxRef.current
          if (!prefs.messages || sender_id === myId || sender_id === openPeer) return
          const sender = people.find((p) => p.id === sender_id)
          setNotice(`New message from ${sender?.name ?? 'your pickup partner'}.`)
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload) => {
          if (!alertCtxRef.current.prefs.community) return
          if (payload.new.author_id === myId) return
          setNotice('New in Community — take a look.')
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [myId])
  const activeConvoCount = requests.filter(
    (r) =>
      (r.postedBy === myId || r.collectedBy === myId) &&
      ['accepted', 'collected', 'disputed', 'payment_sent'].includes(r.status)
  ).length

  // Real impact ledger for the account menu — derived from live requests, no fake numbers.
  const myRatings = requests.filter(
    (r) => r.collectedBy === myId && r.rating != null
  )
  const userStats = {
    posted: requests.filter((r) => r.postedBy === myId).length,
    collected: requests.filter(
      (r) => r.collectedBy === myId && ['collected', 'paid'].includes(r.status)
    ).length,
    ratingCount: myRatings.length,
    rating: myRatings.length
      ? myRatings.reduce((sum, r) => sum + r.rating, 0) / myRatings.length
      : 0,
  }

  // Green Collector credential lookup — one derivation, every trust surface.
  function credentialFor(userId) {
    const profile = profiles.find((p) => p.id === userId)
    return profile ? { profile, credential: deriveCredential(requests, profile) } : null
  }

  // A conversation is a person, not a pickup. Opening any pickup with someone
  // opens the single shared thread with that person.
  function openThread(request) {
    const peer = request.postedBy === myId ? request.collectedBy : request.postedBy
    if (peer) setActiveThreadPeer(peer)
  }

  // Every non-open pickup I share with the active counterpart, newest first —
  // one chat, many pickup collections.
  const activeThreadRequests = activeThreadPeer
    ? requests
        .filter(
          (r) =>
            r.status !== 'open' &&
            ((r.postedBy === myId && r.collectedBy === activeThreadPeer) ||
              (r.collectedBy === myId && r.postedBy === activeThreadPeer))
        )
        .sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt))
    : []

  if (appState === 'loading') {
    return <LoadingScreen onDone={handleLoadingDone} />
  }

  if (appState === 'auth') {
    if (authView === 'landing') {
      return (
        <Landing
          onGetStarted={() => { setAuthMode('signup'); setAuthView('form') }}
          onLogIn={() => { setAuthMode('login'); setAuthView('form') }}
        />
      )
    }
    return (
      <AuthScreen
        onLogin={handleLogin}
        notice={authNotice}
        initialMode={authMode}
        onBack={() => setAuthView('landing')}
      />
    )
  }

  return (
    <div className="min-h-screen font-sans" style={{ background: 'var(--surface)' }}>
      {view !== 'home' && <TopBar />}

      <main className="max-w-[430px] mx-auto pb-24">
        {view === 'home' && (
          <DispatchHome
            requests={requests}
            currentUser={currentUser}
            onCompose={() => setComposerOpen(true)}
            onAccept={(id) => updateStatus(id, 'accepted')}
            onOpenThread={openThread}
            onOpenDispatchRadar={(req) => setActiveDispatchRequestId(req.id)}
            online={online}
            setOnline={setOnline}
            location={location}
            nearbyCollectors={homeCollectors}
          />
        )}
        {view === 'community' && (
          <FeedView
            posts={posts}
            addPost={addPost}
            onLike={handlePostLike}
            currentUser={currentUser}
          />
        )}
        {view === 'leaderboard' && (
          <LeaderboardView
            requests={requests}
            users={profiles}
            currentUser={currentUser}
          />
        )}
        {view === 'you' && (
          <ProfileView
            currentUser={currentUser}
            profile={profiles.find((p) => p.id === myId)}
            requests={requests}
            stats={userStats}
            onLogout={handleLogout}
            onSavePaymentDetails={savePaymentDetails}
            onUploadAvatar={uploadAvatar}
            onSaveName={saveAccountName}
            onChangeEmail={changeEmail}
            onChangePassword={changePassword}
            notificationPrefs={myPrefs}
            onSaveNotificationPrefs={saveNotificationPrefs}
            credentialFor={credentialFor}
          />
        )}
      </main>

      <BottomNav
        view={view}
        setView={setView}
        unreadCount={activeConvoCount}
        onOpenMessages={() => setMessagesOpen(true)}
      />

      {composerOpen && (
        <ComposerModal onClose={() => setComposerOpen(false)} onSubmit={addRequest} />
      )}

      {messagesOpen && !activeThreadPeer && (
        <Conversations
          requests={requests}
          currentUser={currentUser}
          users={profiles}
          onClose={() => setMessagesOpen(false)}
          onOpenThread={openThread}
        />
      )}

      {activeThreadPeer && activeThreadRequests.length > 0 && (
        <MessageThread
          requests={activeThreadRequests}
          counterpartId={activeThreadPeer}
          currentUser={currentUser}
          users={profiles}
          onClose={() => setActiveThreadPeer(null)}
          onUpdateStatus={updateStatus}
          onSubmitAfterPhoto={handleAfterPhoto}
          onRejectProof={handleRejectProof}
          onMarkPaymentSent={markPaymentSent}
          onConfirmPaymentReceived={confirmPaymentReceived}
          onPaymentNotReceived={reportPaymentNotReceived}
          onRate={handleRate}
          credentialFor={credentialFor}
        />
      )}

      {radarRequest && (
        <div className="fixed inset-0 z-[200] mx-auto flex w-full max-w-[430px] flex-col overflow-hidden" style={{ background: 'var(--surface)' }}>
          <div
            className="flex items-center border-b p-4"
            style={{ background: 'var(--surface-ink)', borderColor: 'var(--border-ink)' }}
          >
            <button
              className="tt-press -ml-2 p-2"
              style={{ color: 'var(--text-on-ink-muted)' }}
              onClick={() => setActiveDispatchRequestId(null)}
              aria-label="Back"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <h2 className="flex-1 pr-6 text-center font-display text-[17px] font-semibold" style={{ color: 'var(--text-on-ink)' }}>
              Dispatch Radar
            </h2>
          </div>
          <div className="relative flex-1 overflow-hidden">
            <DispatchRadar
              request={radarRequest}
              collectors={radarCollectors}
              offers={radarOffers}
              onCancel={cancelRequest}
              onAcceptOffer={acceptPriceOffer}
              onDeclineOffer={declinePriceOffer}
            />
          </div>
        </div>
      )}

      {(() => {
        const offerReq = incomingOfferReqId ? requests.find(r => r.id === incomingOfferReqId) : null
        if (!offerReq || offerReq.status !== 'open') return null
        const offerPoster = profiles.find(p => p.id === offerReq.postedBy)
        const offerDist = location && offerReq.lat ? haversineDistance(location.lat, location.lng, offerReq.lat, offerReq.lng) : null
        return (
          <IncomingOffer
            key={offerReq.id}
            request={offerReq}
            poster={offerPoster}
            distanceMeters={offerDist}
            onAccept={(id) => updateStatus(id, 'accepted')}
            onPass={(id) => {
              const passed = JSON.parse(localStorage.getItem('passed_requests') || '[]')
              localStorage.setItem('passed_requests', JSON.stringify([...passed, id]))
              setIncomingOfferReqId(null)
            }}
            onCounter={submitPriceOffer}
            onDismiss={() => setIncomingOfferReqId(null)}
          />
        )
      })()}

      <Toast message={realtimeDown ? 'Connection lost — reconnecting…' : null} />
      <Toast message={!realtimeDown ? notice : null} tone="info" />
    </div>
  )
}

export default App
