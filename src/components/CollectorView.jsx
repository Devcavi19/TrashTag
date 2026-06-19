import { useState } from 'react'
import TrashCard from './TrashCard'
import Leaderboard from './Leaderboard'
import SuccessModal from './SuccessModal'

const SUCCESS_MESSAGES = {
  accepted: {
    title: 'Job accepted!',
    message: 'Find it under your active jobs and upload an after-photo when done.',
  },
  collected: {
    title: 'Marked as collected!',
    message: 'The poster has been notified to confirm payment.',
  },
}

function CollectorView({ requests, updateStatus, currentUser, onSubmitAfterPhoto, onLike, users }) {
  const [afterPhotoFiles, setAfterPhotoFiles] = useState({})
  const [afterPhotoPreviews, setAfterPhotoPreviews] = useState({})
  const [success, setSuccess] = useState(null)

  const activeJobs = requests.filter(r => r.status === 'accepted')
  const openJobs = requests.filter(r => r.status === 'open' && r.postedBy !== currentUser?.id)

  function handleFileChange(id, file) {
    if (!file) return
    setAfterPhotoFiles(prev => ({ ...prev, [id]: file }))
    setAfterPhotoPreviews(prev => ({ ...prev, [id]: URL.createObjectURL(file) }))
  }

  function handleUpdate(reqId, newStatus, photoId) {
    if (newStatus === 'collected') {
      onSubmitAfterPhoto(reqId, afterPhotoFiles[photoId])
      updateStatus(reqId, 'collected')
      setAfterPhotoFiles(prev => { const n = { ...prev }; delete n[photoId]; return n })
      setAfterPhotoPreviews(prev => { const n = { ...prev }; delete n[photoId]; return n })
    } else {
      updateStatus(reqId, newStatus)
    }
    if (SUCCESS_MESSAGES[newStatus]) setSuccess(SUCCESS_MESSAGES[newStatus])
  }

  function makeUpdateStatus(id) {
    return (reqId, newStatus) => handleUpdate(reqId, newStatus, id)
  }

  return (
    <div className="p-4 space-y-5">
      {activeJobs.length > 0 && (
        <section>
          <h2
            className="text-[10px] font-bold uppercase tracking-widest mb-3"
            style={{ color: '#c97f1e' }}
          >
            Active Job
          </h2>
          <div className="space-y-3">
            {activeJobs.map(r => (
              <div key={r.id} className="space-y-2">
                {/* After-photo upload zone */}
                <div
                  className="rounded-xl overflow-hidden"
                  style={{ border: '1.5px dashed #2f6b44', background: '#f6fdf8' }}
                >
                  {afterPhotoPreviews[r.id] ? (
                    <div className="relative">
                      <img
                        src={afterPhotoPreviews[r.id]}
                        alt="after"
                        className="w-full object-cover"
                        style={{ maxHeight: 140 }}
                      />
                      <label
                        className="absolute bottom-2 right-2 text-xs font-semibold px-2 py-1 rounded-lg cursor-pointer"
                        style={{ background: 'rgba(0,0,0,0.55)', color: '#fff' }}
                      >
                        Change
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => handleFileChange(r.id, e.target.files[0])}
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center py-5 gap-1 cursor-pointer">
                      <span className="text-2xl" style={{ opacity: 0.4 }}>📷</span>
                      <span className="text-xs font-semibold" style={{ color: '#2f6b44' }}>
                        Upload After Photo
                      </span>
                      <span className="text-[10px]" style={{ color: '#a8a5a0' }}>
                        Required before marking collected
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => handleFileChange(r.id, e.target.files[0])}
                      />
                    </label>
                  )}
                </div>

                <TrashCard
                  request={r}
                  viewerRole="collector"
                  onUpdateStatus={makeUpdateStatus(r.id)}
                  stagedAfterPhoto={afterPhotoFiles[r.id]}
                  onLike={onLike}
                  currentUserId={currentUser?.id}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2
          className="text-[10px] font-bold uppercase tracking-widest mb-3"
          style={{ color: '#a8a5a0' }}
        >
          Available Jobs
        </h2>
        {openJobs.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-2 text-center">
            <span className="text-3xl" style={{ opacity: 0.25 }}>✅</span>
            <p className="text-sm font-medium" style={{ color: '#c8c5c0' }}>
              No open jobs right now. Check back soon!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {openJobs.map(r => (
              <TrashCard
                key={r.id}
                request={r}
                viewerRole="collector"
                onUpdateStatus={(reqId, newStatus) => handleUpdate(reqId, newStatus, r.id)}
                onLike={onLike}
                currentUserId={currentUser?.id}
              />
            ))}
          </div>
        )}
      </section>

      <Leaderboard requests={requests} users={users} />

      <SuccessModal
        open={!!success}
        title={success?.title}
        message={success?.message}
        buttonLabel="Done"
        onClose={() => setSuccess(null)}
      />
    </div>
  )
}

export default CollectorView
