import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { validateImage } from '../lib/validateImage'
import Button from './ui/Button'

const tint = (token) => `color-mix(in srgb, ${token} 14%, transparent)`

const TYPE_OPTIONS = [
  { key: 'event', label: 'Event', color: 'var(--success)', bg: tint('var(--success)') },
  { key: 'news',  label: 'News',  color: 'var(--tag-rec-fg)', bg: 'var(--tag-rec-bg)' },
  { key: 'post',  label: 'Post',  color: 'var(--accent)', bg: tint('var(--accent)') },
]

function FieldLabel({ children, optional }) {
  return (
    <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
      {children} {optional && <span style={{ fontWeight: 500 }}>(optional)</span>}
    </label>
  )
}

function CreatePostForm({ onSubmit }) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState('post')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [eventDate, setEventDate] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [externalUrl, setExternalUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
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

  function reset() {
    setType('post')
    setTitle('')
    setBody('')
    setPhotoFile(null)
    setPhotoPreview(null)
    setPhotoError(null)
    setEventDate('')
    setEventLocation('')
    setExternalUrl('')
  }

  async function handleSubmit() {
    if (!body.trim() || submitting) return
    setSubmitting(true)

    let photoUrl = null
    if (photoFile) {
      const ext = photoFile.name.split('.').pop() || 'jpg'
      const path = `${Date.now()}.${ext}`
      const { data: uploadData } = await supabase.storage.from('post-photos').upload(path, photoFile)
      if (uploadData) {
        const { data: { publicUrl } } = supabase.storage.from('post-photos').getPublicUrl(uploadData.path)
        photoUrl = publicUrl
      }
    }

    await onSubmit({
      type,
      title: title.trim() || null,
      body: body.trim(),
      photo_url: photoUrl,
      event_date: type === 'event' && eventDate ? eventDate : null,
      event_location: type === 'event' && eventLocation.trim() ? eventLocation.trim() : null,
      external_url: externalUrl.trim() || null,
    })

    reset()
    setSubmitting(false)
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="tt-press flex w-full items-center gap-3 px-4 py-3.5 text-left"
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
          style={{ background: 'color-mix(in srgb, var(--brand) 12%, transparent)', color: 'var(--brand)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>
        <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
          Share an event, news, or tip…
        </span>
      </button>
    )
  }

  return (
    <div
      className="overflow-hidden"
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>New Post</span>
        <button
          onClick={() => { reset(); setOpen(false) }}
          className="text-[11px] font-bold uppercase tracking-widest"
          style={{ color: 'var(--text-muted)' }}
        >
          Cancel
        </button>
      </div>

      <div className="space-y-4 p-4">
        {/* Type selector */}
        <div>
          <FieldLabel>Type</FieldLabel>
          <div className="grid grid-cols-3 gap-2">
            {TYPE_OPTIONS.map((opt) => {
              const selected = type === opt.key
              return (
                <button
                  key={opt.key}
                  onClick={() => setType(opt.key)}
                  className="tt-press rounded-xl py-2.5 text-center text-[12px] font-bold"
                  style={{
                    border: selected ? `2px solid ${opt.color}` : '2px solid var(--border)',
                    background: selected ? opt.bg : 'transparent',
                    color: selected ? opt.color : 'var(--text-muted)',
                    outline: 'none',
                  }}
                  aria-pressed={selected}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Title */}
        <div>
          <FieldLabel optional>Title</FieldLabel>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your post a headline"
            maxLength={100}
            className="tt-input w-full px-3 py-2.5 text-sm"
          />
        </div>

        {/* Body */}
        <div>
          <FieldLabel>Body</FieldLabel>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What would you like to share?"
            rows={4}
            maxLength={2000}
            className="tt-input w-full resize-none px-3 py-2.5 text-sm"
          />
        </div>

        {/* Event fields */}
        {type === 'event' && (
          <div className="grid grid-cols-1 gap-3">
            <div>
              <FieldLabel optional>Event Date</FieldLabel>
              <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="tt-input w-full px-3 py-2.5 text-sm" />
            </div>
            <div>
              <FieldLabel optional>Event Location</FieldLabel>
              <input type="text" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} placeholder="Where is it happening?" className="tt-input w-full px-3 py-2.5 text-sm" />
            </div>
          </div>
        )}

        {/* External URL */}
        <div>
          <FieldLabel optional>Link</FieldLabel>
          <input type="url" value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder="https://…" className="tt-input w-full px-3 py-2.5 text-sm" />
        </div>

        {/* Photo */}
        <div>
          <FieldLabel optional>Photo</FieldLabel>
          <label
            className="flex w-full cursor-pointer flex-col items-center justify-center overflow-hidden transition-colors"
            style={{
              height: 120,
              borderRadius: 'var(--radius-control)',
              border: '2px dashed var(--border)',
              background: photoPreview ? 'transparent' : 'color-mix(in srgb, var(--text-primary) 3%, transparent)',
            }}
          >
            {photoPreview ? (
              <img src={photoPreview} alt="preview" className="h-full w-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
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

        {/* Submit */}
        <Button full disabled={!body.trim() || submitting} loading={submitting} onClick={handleSubmit} style={{ paddingBlock: 12 }}>
          {submitting ? 'Posting…' : 'Share Post'}
        </Button>
      </div>
    </div>
  )
}

export default CreatePostForm
