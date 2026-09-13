import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Button } from './Button'
import type { IconName } from './Icon'

/** Small dropdown used for row actions. Closes on outside click or Escape. */
export function Menu({
  label = 'Actions',
  icon = 'more',
  children,
}: {
  label?: string
  icon?: IconName
  children: (close: () => void) => ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className="menu-anchor" ref={ref}>
      <Button
        variant="ghost"
        size="sm"
        icon={icon}
        iconOnly
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      />
      {open && <div className="menu">{children(() => setOpen(false))}</div>}
    </div>
  )
}
