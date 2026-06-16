import { useState } from 'react'

const priceMap = { Biodegradable: 20, Recyclable: 30, Residual: 50 }

function PostForm({ onSubmit }) {
  const [photo, setPhoto] = useState(null)
  const [gps, setGps] = useState('')
  const [type, setType] = useState('Biodegradable')

  function handlePhoto(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPhoto(reader.result)
    reader.readAsDataURL(file)
  }

  function handleSubmit() {
    onSubmit({
      id: String(Date.now()),
      photo,
      gps,
      type,
      price: priceMap[type],
      status: 'open',
      postedAt: new Date().toISOString(),
    })
    setPhoto(null)
    setGps('')
    setType('Biodegradable')
  }

  return (
    <div className="p-4 border rounded space-y-3">
      <h3 className="font-semibold text-lg">New Pickup Request</h3>

      <div>
        <label className="block text-sm font-medium mb-1">Photo</label>
        <input type="file" accept="image/*" onChange={handlePhoto} />
        {photo && (
          <img src={photo} alt="preview" className="mt-2 h-32 w-32 object-cover rounded" />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Location (Barangay / Street)</label>
        <input
          type="text"
          value={gps}
          onChange={e => setGps(e.target.value)}
          placeholder="e.g. Brgy. San Jose, Rizal St."
          className="border rounded px-2 py-1 w-full"
        />
      </div>

      <div className="flex items-center gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Trash Type</label>
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option>Biodegradable</option>
            <option>Recyclable</option>
            <option>Residual</option>
          </select>
        </div>
        <div className="mt-5 text-green-700 font-semibold text-lg">
          ₱{priceMap[type]}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!gps.trim()}
        className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-40"
      >
        Submit Request
      </button>
    </div>
  )
}

export default PostForm
