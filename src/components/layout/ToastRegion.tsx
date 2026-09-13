import { useToast } from '../../store/ToastProvider'
import { Button } from '../ui/Button'

export function ToastRegion() {
  const { toasts, dismiss } = useToast()
  if (toasts.length === 0) return null
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.tone}`}>
          <span className="toast__dot" />
          <p>{toast.message}</p>
          {toast.action && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                toast.action?.run()
                dismiss(toast.id)
              }}
            >
              {toast.action.label}
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            icon="close"
            iconOnly
            aria-label="Dismiss"
            onClick={() => dismiss(toast.id)}
          />
        </div>
      ))}
    </div>
  )
}
