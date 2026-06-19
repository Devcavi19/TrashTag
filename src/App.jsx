import { useState, useEffect } from 'react'
import { sampleRequest } from './data/sampleRequest'
import { useSharedRequests } from './hooks/useSharedRequests'
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
  const [requests, setRequests] = useSharedRequests([sampleRequest])

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

  function addRequest(newReq) {
    setRequests((prev) => [
      ...prev,
      { ...newReq, rating: null, afterPhoto: null, likes: [], collectedBy: null, postedBy: currentUser?.id },
    ])
  }

  function updateStatus(id, newStatus) {
    setRequests((prev) =>
      prev.map((req) =>
        req.id === id
          ? {
              ...req,
              status: newStatus,
              ...(newStatus === 'accepted' ? { collectedBy: currentUser?.id } : {}),
            }
          : req
      )
    )
  }

  function handleAfterPhoto(id, photoDataUrl) {
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, afterPhoto: photoDataUrl } : req))
    )
  }

  function handleLike(requestId, userId) {
    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req
        const liked = req.likes.includes(userId)
        return {
          ...req,
          likes: liked ? req.likes.filter((id) => id !== userId) : [...req.likes, userId],
        }
      })
    )
  }

  function handleRate(id, stars) {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, rating: stars } : r))
    )
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
