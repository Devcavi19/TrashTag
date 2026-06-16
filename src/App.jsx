import { useState } from 'react'
import { sampleRequest } from './data/sampleRequest'
import PosterView from './components/PosterView'
import CollectorView from './components/CollectorView'
import TopBar from './components/TopBar'

function App() {
  const [role, setRole] = useState('poster') // 'poster' | 'collector'
  const [requests, setRequests] = useState([sampleRequest])

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

  const openCount = requests.filter(r => r.status === 'open').length

  return (
    <div className="min-h-screen font-sans" style={{ background: '#f3f4f2' }}>
      <TopBar role={role} setRole={setRole} openCount={openCount} />

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
