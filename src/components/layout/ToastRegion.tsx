import { useToast } from '../../store/ToastProvider'

export function ToastRegion() {
  const { toasts } = useToast()
  if (toasts.length === 0) return null
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast">
          {toast.message}
        </div>
      ))}
    </div>
  )
}
