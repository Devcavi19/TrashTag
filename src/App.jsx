import { useState } from 'react'
import sampleRequest from './data/sampleRequest'
import PosterView from './components/PosterView'
import CollectorView from './components/CollectorView'

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
      {/* Temporary role toggle for development */}
      <div className="flex gap-2 p-2 bg-gray-200">
        <button
          className={`px-3 py-1 rounded text-sm font-medium ${role === 'poster' ? 'bg-green-600 text-white' : 'bg-white text-gray-700'}`}
          onClick={() => setRole('poster')}
        >
          Poster
        </button>
        <button
          className={`px-3 py-1 rounded text-sm font-medium ${role === 'collector' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
          onClick={() => setRole('collector')}
        >
          Collector
        </button>
      </div>

      {role === 'poster' ? (
        <PosterView
          requests={requests}
          addRequest={addRequest}
          updateStatus={updateStatus}
        />
      ) : (
        <CollectorView requests={requests} updateStatus={updateStatus} />
      )}
    </div>
  )
}

export default App
