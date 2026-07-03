import Sheet from './ui/Sheet'
import Button from './ui/Button'

function ConfirmModal({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmColor,
  onConfirm,
  onCancel,
}) {
  return (
    <Sheet open={open} title={title} onClose={onCancel}>
      {message && (
        <p className="text-sm leading-snug" style={{ color: 'var(--text-secondary)' }}>
          {message}
        </p>
      )}
      <div className="mt-4 flex gap-2">
        <Button variant="secondary" full onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button
          full
          onClick={onConfirm}
          style={confirmColor ? { background: confirmColor } : undefined}
        >
          {confirmLabel}
        </Button>
      </div>
    </Sheet>
  )
}

export default ConfirmModal
