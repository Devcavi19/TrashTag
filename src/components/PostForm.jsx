import { useState, lazy, Suspense } from 'react'
import { supabase } from '../lib/supabase'
import { TAG_COLORS } from '../lib/tagColors'
import { validateImage } from '../lib/validateImage'
import ConfirmModal from './ConfirmModal'
import SuccessModal from './SuccessModal'
import Button from './ui/Button'

// Leaflet is heavy; load the picker (and the map with it) only when composing.
const LocationPicker = lazy(() => import('./LocationPicker'))

const TAG_OPTIONS = ['Biodegradable', 'Recyclable', 'Residual', 'Mixed']

function FieldLabel({ children }) {
  return (
    <label
      className="mb-2 block text-[11px] font-bold uppercase tracking-widest"
      style={{ color: 'var(--text-muted)' }}
    >
      {children}
    </label>
  )
}

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
      className="overflow-hidden"
      style={{
        background: 'var(--surface-card)',
        borderRadius: 'var(--radius-card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Header strip */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <span className="font-display text-[18px]" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
          New pickup
        </span>
        <span
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: 'var(--text-muted)' }}
        >
          You pay · they clean
        </span>
      </div>

      <div className="space-y-4 p-4">
        {/* Photo upload */}
        <div>
          <FieldLabel>Photo</FieldLabel>
          <label
            className="flex w-full cursor-pointer flex-col items-center justify-center overflow-hidden transition-colors"
            style={{
              height: 120,
              borderRadius: 'var(--radius-control)',
              border: '2px dashed var(--border)',
              background: photoPreview
                ? 'transparent'
                : 'color-mix(in srgb, var(--text-primary) 3%, transparent)',
            }}
          >
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                <span className="text-xs font-medium">Add a photo</span>
              </div>
            )}
            <input type="file" accept="image/jpeg,image/png" onChange={handlePhoto} className="sr-only" />
          </label>
          {photoError && (
            <p className="mt-1.5 text-[11px] font-medium" style={{ color: 'var(--danger)' }}>{photoError}</p>
          )}
        </div>

        {/* Location */}
        <div>
          <FieldLabel>Location</FieldLabel>
          <Suspense fallback={<div className="tt-skeleton h-12 w-full" />}>
            <LocationPicker onChange={setLocation} />
          </Suspense>
        </div>

        {/* Trash tags — multi-select pills */}
        <div>
          <FieldLabel>Tags</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {TAG_OPTIONS.map((tag) => {
              const selected = tags.includes(tag)
              const c = TAG_COLORS[tag]
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className="tt-press rounded-full px-3.5 py-1.5 text-[12px] font-bold"
                  style={{
                    border: selected ? `2px solid ${c.color}` : '2px solid var(--border)',
                    background: selected ? c.bg : 'transparent',
                    color: selected ? c.color : 'var(--text-muted)',
                    outline: 'none',
                  }}
                  aria-pressed={selected}
                >
                  {tag}
                </button>
              )
            })}
          </div>
        </div>

        {/* Offer price */}
        <div>
          <FieldLabel>Offer Price</FieldLabel>
          <div
            className="flex items-center overflow-hidden"
            style={{
              borderRadius: 'var(--radius-control)',
              border: '2px solid var(--border)',
              background: 'color-mix(in srgb, var(--text-primary) 3%, transparent)',
            }}
          >
            <span className="pl-3.5 pr-1 text-[20px] font-bold" style={{ color: 'var(--accent)' }}>
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
              style={{ color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        {/* Submit */}
        <Button full disabled={!canSubmit} onClick={() => setConfirmOpen(true)} style={{ paddingBlock: 12 }}>
          Post pickup
        </Button>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Post this pickup?"
        message={`Post a ${tags.join(', ')} pickup at "${location.label}" for a ₱${priceValid ? priceNum : 0} payout.`}
        confirmLabel="Post pickup"
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
