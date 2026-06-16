import StatusBadge from './StatusBadge'

function ActionButton({ viewerRole, status, id, price, onUpdateStatus }) {
  if (viewerRole === 'collector') {
    if (status === 'open') {
      return (
        <button
          onClick={() => onUpdateStatus(id, 'accepted')}
          className="w-full mt-3 bg-blue-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-blue-700 active:scale-95 transition"
        >
          Accept Job
        </button>
      )
    }
    if (status === 'accepted') {
      return (
        <button
          onClick={() => onUpdateStatus(id, 'collected')}
          className="w-full mt-3 bg-sky-500 text-white text-sm font-semibold py-2 rounded-lg hover:bg-sky-600 active:scale-95 transition"
        >
          Mark as Collected
        </button>
      )
    }
  }

  if (viewerRole === 'poster' && status === 'collected') {
    return (
      <button
        onClick={() => onUpdateStatus(id, 'paid')}
        className="w-full mt-3 bg-green-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-green-700 active:scale-95 transition"
      >
        Confirm &amp; Pay ₱{price}
      </button>
    )
  }

  return null
}

export default function TrashCard({ request, viewerRole, onUpdateStatus }) {
  const { id, photo, type, status, gps, price, postedAt } = request

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
      {photo ? (
        <img
          src={photo}
          alt="trash"
          className="w-full object-cover"
          style={{ maxHeight: 150 }}
        />
      ) : (
        <div
          className="w-full bg-gray-200 flex items-center justify-center text-gray-400 text-sm"
          style={{ height: 150 }}
        >
          No Photo
        </div>
      )}

      <div className="p-4 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          <StatusBadge variant={type} />
          <StatusBadge variant={status} />
        </div>

        <p className="text-gray-500 text-xs">{gps}</p>

        <p className="text-green-600 font-bold text-base">₱{price}</p>

        <p className="text-gray-400 text-xs">{postedAt}</p>

        <ActionButton
          viewerRole={viewerRole}
          status={status}
          id={id}
          price={price}
          onUpdateStatus={onUpdateStatus}
        />
      </div>
    </div>
  )
}
