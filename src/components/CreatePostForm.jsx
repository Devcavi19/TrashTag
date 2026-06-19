import { useState } from 'react'
import { supabase } from '../lib/supabase'

const TYPE_OPTIONS = [
  { key: 'event', label: 'Event', color: '#2f6b44', bg: '#eaf5ec' },
  { key: 'news',  label: 'News',  color: '#1966b5', bg: '#e8f0fe' },
  { key: 'post',  label: 'Post',  color: '#c97f1e', bg: '#fef3e0' },
]

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

  function handlePhoto(e) {
    const file = e.target.files[0]
    if (!file) return
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
        className="w-full flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 text-left transition-all active:scale-[0.99]"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)' }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: '#eaf5ec', color: '#2f6b44' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>
        <span className="text-sm font-medium" style={{ color: '#a8a5a0' }}>
          Share an event, news, or tip…
        </span>
      </button>
    )
  }

  const inputStyle = {
    border: '1px solid #e8e8e6',
    background: '#fafaf9',
    outline: 'none',
  }

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)' }}
    >
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #f0efec' }}>
        <span className="text-[15px] font-bold" style={{ color: '#1c1c1e' }}>New Post</span>
        <button onClick={() => { reset(); setOpen(false) }} className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#b0ada8' }}>
          Cancel
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Type selector */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: '#a8a5a0' }}>Type</label>
          <div className="grid grid-cols-3 gap-2">
            {TYPE_OPTIONS.map((opt) => {
              const selected = type === opt.key
              return (
                <button
                  key={opt.key}
                  onClick={() => setType(opt.key)}
                  className="rounded-xl py-2.5 text-center text-[12px] font-bold transition-all active:scale-95"
                  style={{
                    border: selected ? `2px solid ${opt.color}` : '2px solid #e8e8e6',
                    background: selected ? opt.bg : '#fafaf9',
                    color: selected ? opt.color : '#a8a5a0',
                    outline: 'none',
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: '#a8a5a0' }}>Title <span style={{ fontWeight: 500 }}>(optional)</span></label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your post a headline"
            className="w-full rounded-xl px-3 py-2.5 text-sm"
            style={inputStyle}
          />
        </div>

        {/* Body */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: '#a8a5a0' }}>Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What would you like to share?"
            rows={4}
            className="w-full rounded-xl px-3 py-2.5 text-sm resize-none"
            style={inputStyle}
          />
        </div>

        {/* Event fields */}
        {type === 'event' && (
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: '#a8a5a0' }}>Event Date <span style={{ fontWeight: 500 }}>(optional)</span></label>
              <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm" style={inputStyle} />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: '#a8a5a0' }}>Event Location <span style={{ fontWeight: 500 }}>(optional)</span></label>
              <input type="text" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} placeholder="Where is it happening?" className="w-full rounded-xl px-3 py-2.5 text-sm" style={inputStyle} />
            </div>
          </div>
        )}

        {/* External URL */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: '#a8a5a0' }}>Link <span style={{ fontWeight: 500 }}>(optional)</span></label>
          <input type="url" value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder="https://…" className="w-full rounded-xl px-3 py-2.5 text-sm" style={inputStyle} />
        </div>

        {/* Photo */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: '#a8a5a0' }}>Photo <span style={{ fontWeight: 500 }}>(optional)</span></label>
          <label
            className="flex flex-col items-center justify-center w-full cursor-pointer rounded-xl overflow-hidden transition-colors"
            style={{ height: 120, border: '2px dashed #dddcda', background: photoPreview ? 'transparent' : '#fafaf9' }}
          >
            {photoPreview ? (
              <img src={photoPreview} alt="preview" className="h-full w-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-1.5">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c8c5c0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
                </svg>
                <span className="text-xs font-medium" style={{ color: '#c8c5c0' }}>Add a photo</span>
              </div>
            )}
            <input type="file" accept="image/*" onChange={handlePhoto} className="sr-only" />
          </label>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!body.trim() || submitting}
          className="w-full text-white text-sm font-semibold py-3 rounded-xl transition-all active:scale-95 disabled:opacity-40"
          style={{ background: '#0d3320' }}
        >
          {submitting ? 'Posting…' : 'Share Post'}
        </button>
      </div>
    </div>
  )
}

export default CreatePostForm
