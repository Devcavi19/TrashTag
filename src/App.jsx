import { useState } from 'react'
import { sampleRequest } from './data/sampleRequest'
import PosterView from './components/PosterView'
import CollectorView from './components/CollectorView'
import TopBar from './components/TopBar'

function App() {
  const [role, setRole] = useState('poster') // 'poster' | 'collector'
  const [requests, setRequests] = useState([sampleRequest])

  function addRequest(newReq) {
    setRequests((prev) => [...prev, newReq])
  }

  function updateStatus(id, newStatus) {
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: newStatus } : req))
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar role={role} setRole={setRole} />

      <main className="max-w-[430px] mx-auto">
        {role === 'poster' ? (
          <PosterView
            requests={requests}
            addRequest={addRequest}
            updateStatus={updateStatus}
          />
        ) : (
          <CollectorView requests={requests} updateStatus={updateStatus} />
        )}
      </main>
    </div>
  )
}

export default App
