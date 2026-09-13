import type { ReactNode } from 'react'

type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info'

export function Badge({
  tone = 'neutral',
  dot = false,
  children,
}: {
  tone?: Tone
  dot?: boolean
  children: ReactNode
}) {
  return (
    <span className={`badge${tone === 'neutral' ? '' : ` badge--${tone}`}${dot ? ' badge--dot' : ''}`}>
      {children}
    </span>
  )
}
