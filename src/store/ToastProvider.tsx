import { createContext, use, useCallback, useMemo, useState, type ReactNode } from 'react'

export interface Toast {
  id: number
  message: string
}

interface ToastContextValue {
  toasts: Toast[]
  notify: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let nextId = 1

/** Small confirmations for things like copying a link. Nothing is persisted. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const notify = useCallback((message: string) => {
    const id = nextId++
    setToasts((prev) => [...prev, { id, message }])
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2600)
  }, [])

  const value = useMemo(() => ({ toasts, notify }), [toasts, notify])
  return <ToastContext value={value}>{children}</ToastContext>
}

export function useToast(): ToastContextValue {
  const ctx = use(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
