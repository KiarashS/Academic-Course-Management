import { createContext, use, useCallback, useMemo, useState, type ReactNode } from 'react'

export interface Toast {
  id: number
  message: string
  tone: 'success' | 'error' | 'info'
  action?: { label: string; run: () => void }
}

interface ToastContextValue {
  toasts: Toast[]
  notify: (message: string, tone?: Toast['tone'], action?: Toast['action']) => void
  dismiss: (id: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let nextId = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const notify = useCallback<ToastContextValue['notify']>(
    (message, tone = 'success', action) => {
      const id = nextId++
      setToasts((prev) => [...prev, { id, message, tone, action }])
      window.setTimeout(() => dismiss(id), action ? 8000 : 4000)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ toasts, notify, dismiss }), [toasts, notify, dismiss])
  return <ToastContext value={value}>{children}</ToastContext>
}

export function useToast(): ToastContextValue {
  const ctx = use(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
