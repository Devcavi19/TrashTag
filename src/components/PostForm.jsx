import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { TAG_COLORS } from '../lib/tagColors'
import { validateImage } from '../lib/validateImage'
import ConfirmModal from './ConfirmModal'
import SuccessModal from './SuccessModal'
import LocationPicker from './LocationPicker'

const TAG_OPTIONS = ['Biodegradable', 'Recyclable', 'Residual', 'Mixed']

function PostForm({ onSubmit, onSubmitted }) {
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [location, setLocation] = useState({ lat: null, lng: null, label: '' })
  const [tags, setTags] = useState(['Biodegradable'])
  const [price, setPrice] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [photoError, setPhotoError] = useState(null)

  function handlePhoto(e) {
    const file = e.target.files[0]
    if (!file) return
    const err = validateImage(file)
    if (err) {
      setPhotoError(err)
      setPhotoFile(null)
      setPhotoPreview(null)
      e.target.value = ''
      return
    }
    setPhotoError(null)
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = () => setPhotoPreview(reader.result)
    reader.readAsDataURL(file)
  }

  function toggleTag(tag) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const priceNum = Number(price)
  const priceValid = Number.isInteger(priceNum) && priceNum > 0 && priceNum <= 10000000
  const canSubmit = priceValid && tags.length > 0 && location.label.trim()

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

    await onSubmit({
      photo: photoUrl,
      lat: location.lat,
      lng: location.lng,
      label: location.label,
      tags,
      price: priceNum,
      status: 'open',
      postedAt: new Date().toISOString(),
    })
    setPhotoFile(null)
    setPhotoPreview(null)
    setPhotoError(null)
    setLocation({ lat: null, lng: null, label: '' })
    setTags(['Biodegradable'])
    setPrice('')
    setConfirmOpen(false)
    setSuccessOpen(true)
  }

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
        <span className="font-display text-[18px]" style={{ color: '#1c1c1e', fontWeight: 600 }}>
          New pickup
        </span>
        <span
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: '#b0ada8' }}
        >
          You pay · they clean
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
            <input type="file" accept="image/jpeg,image/png" onChange={handlePhoto} className="sr-only" />
          </label>
          {photoError && (
            <p className="text-[11px] font-medium mt-1.5" style={{ color: '#b53419' }}>{photoError}</p>
          )}
        </div>

        {/* Location */}
        <div>
          <label
            className="block text-[11px] font-bold uppercase tracking-widest mb-2"
            style={{ color: '#a8a5a0' }}
          >
            Location
          </label>
          <LocationPicker onChange={setLocation} />
        </div>

        {/* Trash tags — multi-select pills */}
        <div>
          <label
            className="block text-[11px] font-bold uppercase tracking-widest mb-2"
            style={{ color: '#a8a5a0' }}
          >
            Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {TAG_OPTIONS.map((tag) => {
              const selected = tags.includes(tag)
              const c = TAG_COLORS[tag]
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className="rounded-full px-3.5 py-1.5 text-[12px] font-bold transition-all active:scale-95"
                  style={{
                    border: selected ? `2px solid ${c.color}` : '2px solid #e8e8e6',
                    background: selected ? c.bg : '#fafaf9',
                    color: selected ? c.color : '#a8a5a0',
                    outline: 'none',
                  }}
                >
                  {tag}
                </button>
              )
            })}
          </div>
        </div>

        {/* Offer price */}
        <div>
          <label
            className="block text-[11px] font-bold uppercase tracking-widest mb-2"
            style={{ color: '#a8a5a0' }}
          >
            Offer Price
          </label>
          <div
            className="flex items-center rounded-xl overflow-hidden"
            style={{ border: '2px solid #e8e8e6', background: '#fafaf9' }}
          >
            <span className="pl-3.5 pr-1 text-[20px] font-bold" style={{ color: '#c97f1e' }}>
              ₱
            </span>
            <input
              type="number"
              min="1"
              max="10000000"
              step="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="100"
              className="flex-1 bg-transparent py-3 pr-3.5 text-[20px] font-bold outline-none"
              style={{ color: '#1c1c1e' }}
            />
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={() => setConfirmOpen(true)}
          disabled={!canSubmit}
          className="w-full text-white text-sm font-semibold py-3 rounded-xl transition-all active:scale-95 disabled:opacity-40"
          style={{ background: '#0d3320' }}
        >
          Post pickup
        </button>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Post this pickup?"
        message={`Post a ${tags.join(', ')} pickup at "${location.label}" for a ₱${priceValid ? priceNum : 0} payout.`}
        confirmLabel="Post pickup"
        confirmColor="#0d3320"
        onConfirm={handleSubmit}
        onCancel={() => setConfirmOpen(false)}
      />

      <SuccessModal
        open={successOpen}
        title="Request posted!"
        message="Neighbors near you can now see and accept your pickup request."
        buttonLabel="Done"
        onClose={() => { setSuccessOpen(false); onSubmitted?.() }}
      />
    </div>
  )
}

export default PostForm
