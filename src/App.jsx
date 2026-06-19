import { useState, useEffect } from 'react'
import { useRequests } from './hooks/useRequests'
import { supabase } from './lib/supabase'
import PosterView from './components/PosterView'
import CollectorView from './components/CollectorView'
import TopBar from './components/TopBar'
import LoadingScreen from './components/LoadingScreen'
import AuthScreen from './components/AuthScreen'

function App() {
  const [appState, setAppState] = useState('loading') // 'loading' | 'auth' | 'app'
  const [currentUser, setCurrentUser] = useState(null)
  const [profiles, setProfiles] = useState([])

  const [role, setRole] = useState('poster')
  const [requests] = useRequests()

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, default_role')
      .eq('id', userId)
      .single()
    return data
  }

  async function fetchAllProfiles() {
    const { data } = await supabase.from('profiles').select('id, name, default_role')
    if (data) setProfiles(data)
  }

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
      const user = { ...session.user, name: profile?.name, defaultRole: profile?.default_role }
      setCurrentUser(user)
      setRole(profile?.default_role ?? 'poster')
      await fetchAllProfiles()
      setAppState('app')
    } else {
      setAppState('auth')
    }
  }

  async function handleLogin(authUser) {
    const profile = await fetchProfile(authUser.id)
    const user = { ...authUser, name: profile?.name, defaultRole: profile?.default_role }
    setCurrentUser(user)
    setRole(profile?.default_role ?? 'poster')
    await fetchAllProfiles()
    setAppState('app')
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setCurrentUser(null)
    setProfiles([])
    setAppState('auth')
  }

  async function addRequest(newReq) {
    await supabase.from('requests').insert({
      poster_id: currentUser?.id,
      photo_url: newReq.photo,
      location_label: newReq.gps,
      tags: [newReq.type],
      price: newReq.price,
      status: 'open',
    })
  }

  async function updateStatus(id, newStatus) {
    const updates = { status: newStatus }
    if (newStatus === 'accepted') updates.collected_by = currentUser?.id
    await supabase.from('requests').update(updates).eq('id', id)
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

  async function handleLike(requestId, userId) {
    const req = requests.find((r) => r.id === requestId)
    if (!req) return
    if (req.likes.includes(userId)) {
      await supabase.from('request_likes').delete().eq('request_id', requestId).eq('user_id', userId)
    } else {
      await supabase.from('request_likes').insert({ request_id: requestId, user_id: userId })
    }
  }

  async function handleRate(id, stars) {
    await supabase.from('requests').update({ rating: stars }).eq('id', id)
  }

  const openCount = requests.filter((r) => r.status === 'open' && r.postedBy !== currentUser?.id).length

  if (appState === 'loading') {
    return <LoadingScreen onDone={handleLoadingDone} />
  }

  if (appState === 'auth') {
    return <AuthScreen onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen font-sans" style={{ background: '#f3f4f2' }}>
      <TopBar
        role={role}
        setRole={setRole}
        openCount={openCount}
        user={currentUser}
        onLogout={handleLogout}
      />

      <main className="max-w-[430px] mx-auto">
        {role === 'poster' ? (
          <PosterView
            requests={requests}
            addRequest={addRequest}
            updateStatus={updateStatus}
            onRate={handleRate}
            onLike={handleLike}
            currentUser={currentUser}
            users={profiles}
          />
        ) : (
          <CollectorView
            requests={requests}
            updateStatus={updateStatus}
            currentUser={currentUser}
            onSubmitAfterPhoto={handleAfterPhoto}
            onLike={handleLike}
            users={profiles}
          />
        )}
      </main>
    </div>
  )
}

export default App
