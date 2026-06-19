import { useState } from 'react'
import { supabase } from '../lib/supabase'
import ConfirmModal from './ConfirmModal'
import SuccessModal from './SuccessModal'

const TYPE_OPTIONS = [
  { key: 'Biodegradable', price: 20, color: '#22863a', bg: '#eaf5ec' },
  { key: 'Recyclable',    price: 30, color: '#1966b5', bg: '#e8f0fe' },
  { key: 'Residual',      price: 50, color: '#b53419', bg: '#fce8e6' },
]

function PostForm({ onSubmit }) {
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [gps, setGps] = useState('')
  const [type, setType] = useState('Biodegradable')
  const [locationFocused, setLocationFocused] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)

  function handlePhoto(e) {
    const file = e.target.files[0]
    if (!file) return
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = () => setPhotoPreview(reader.result)
    reader.readAsDataURL(file)
  }

  async function handleSubmit() {
    let photoUrl = null
    if (photoFile) {
      const ext = photoFile.name.split('.').pop() || 'jpg'
      const path = `${Date.now()}.${ext}`
      const { data: uploadData } = await supabase.storage
        .from('trash-photos')
        .upload(path, photoFile)
      if (uploadData) {
        const { data: { publicUrl } } = supabase.storage.from('trash-photos').getPublicUrl(uploadData.path)
        photoUrl = publicUrl
      }
    }

    const selected = TYPE_OPTIONS.find(t => t.key === type)
    await onSubmit({
      photo: photoUrl,
      gps,
      type,
      price: selected?.price ?? 20,
      status: 'open',
      postedAt: new Date().toISOString(),
    })
    setPhotoFile(null)
    setPhotoPreview(null)
    setGps('')
    setType('Biodegradable')
    setConfirmOpen(false)
    setSuccessOpen(true)
  }

  const selectedOption = TYPE_OPTIONS.find(t => t.key === type)

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)' }}
    >
      {/* Header strip */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: '1px solid #f0efec' }}
      >
        <span className="text-[15px] font-bold" style={{ color: '#1c1c1e' }}>
          New Pickup Request
        </span>
        <span
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: '#b0ada8' }}
        >
          Poster
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Photo upload */}
        <div>
          <label
            className="block text-[11px] font-bold uppercase tracking-widest mb-2"
            style={{ color: '#a8a5a0' }}
          >
            Photo
          </label>
          <label
            className="flex flex-col items-center justify-center w-full cursor-pointer rounded-xl overflow-hidden transition-colors"
            style={{
              height: 120,
              border: '2px dashed #dddcda',
              background: photoPreview ? 'transparent' : '#fafaf9',
            }}
          >
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-1.5">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c8c5c0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                <span className="text-xs font-medium" style={{ color: '#c8c5c0' }}>
                  Add a photo
                </span>
              </div>
            )}
            <input type="file" accept="image/*" onChange={handlePhoto} className="sr-only" />
          </label>
        </div>

        {/* Location */}
        <div>
          <label
            className="block text-[11px] font-bold uppercase tracking-widest mb-2"
            style={{ color: '#a8a5a0' }}
          >
            Location
          </label>
          <input
            type="text"
            value={gps}
            onChange={e => setGps(e.target.value)}
            onFocus={() => setLocationFocused(true)}
            onBlur={() => setLocationFocused(false)}
            placeholder="Barangay / Street"
            className="w-full text-sm rounded-xl px-3 py-2.5 outline-none"
            style={{
              background: '#f8f7f5',
              border: locationFocused ? '1.5px solid #2f6b44' : '1.5px solid #e2e2e0',
              color: '#1c1c1e',
              transition: 'border-color 0.15s',
            }}
          />
        </div>

        {/* Trash type — tile selector */}
        <div>
          <label
            className="block text-[11px] font-bold uppercase tracking-widest mb-2"
            style={{ color: '#a8a5a0' }}
          >
            Trash Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {TYPE_OPTIONS.map(opt => {
              const selected = type === opt.key
              return (
                <button
                  key={opt.key}
                  onClick={() => setType(opt.key)}
                  className="rounded-xl py-3 text-center transition-all active:scale-95"
                  style={{
                    border: selected ? `2px solid ${opt.color}` : '2px solid #e8e8e6',
                    background: selected ? opt.bg : '#fafaf9',
                    outline: 'none',
                  }}
                >
                  <div
                    className="text-[11px] font-bold leading-tight mb-1"
                    style={{ color: selected ? opt.color : '#a8a5a0' }}
                  >
                    {opt.key}
                  </div>
                  <div
                    className="text-[15px] font-bold"
                    style={{ color: selected ? opt.color : '#c8c5c0' }}
                  >
                    ₱{opt.price}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={() => setConfirmOpen(true)}
          disabled={!gps.trim()}
          className="w-full text-white text-sm font-semibold py-3 rounded-xl transition-all active:scale-95 disabled:opacity-40"
          style={{ background: '#0d3320' }}
        >
          Submit Request
        </button>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Submit pickup request?"
        message={`Post a ${type} pickup at "${gps}" for a ₱${selectedOption?.price ?? 20} payout.`}
        confirmLabel="Submit Request"
        confirmColor="#0d3320"
        onConfirm={handleSubmit}
        onCancel={() => setConfirmOpen(false)}
      />

      <SuccessModal
        open={successOpen}
        title="Request posted!"
        message="Collectors near you can now see your pickup request."
        buttonLabel="Done"
        onClose={() => setSuccessOpen(false)}
      />
    </div>
  )
}

export default PostForm
