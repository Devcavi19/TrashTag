import { useState } from 'react'
import { sampleRequest } from './data/sampleRequest'
import PosterView from './components/PosterView'
import CollectorView from './components/CollectorView'
import TopBar from './components/TopBar'
import LoadingScreen from './components/LoadingScreen'
import AuthScreen from './components/AuthScreen'

function App() {
  const [appState, setAppState] = useState('loading') // 'loading' | 'auth' | 'app'
  const [currentUser, setCurrentUser] = useState(null)

  const [role, setRole] = useState('poster')
  const [requests, setRequests] = useState([sampleRequest])

  function handleLoadingDone() {
    setAppState('auth')
  }

  function handleLogin(user) {
    setCurrentUser(user)
    setRole(user.defaultRole)
    setAppState('app')
  }

  function handleLogout() {
    setCurrentUser(null)
    setAppState('auth')
  }

  function addRequest(newReq) {
    setRequests((prev) => [...prev, { ...newReq, rating: null }])
  }

  function updateStatus(id, newStatus) {
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: newStatus } : req))
    )
  }

  function handleRate(id, stars) {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, rating: stars } : r))
    )
  }

  const openCount = requests.filter((r) => r.status === 'open').length

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
          />
        ) : (
          <CollectorView requests={requests} updateStatus={updateStatus} />
        )}
      </main>
    </div>
  )
}

export default App
