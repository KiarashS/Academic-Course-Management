import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon, type IconName } from '../ui/Icon'
import { useData } from '../../store/DataProvider'
import { globalSearch, type SearchKind } from '../../lib/selectors'

const KIND_ICON: Record<SearchKind, IconName> = {
  course: 'courses',
  material: 'materials',
  assignment: 'assignments',
  person: 'people',
}

const QUICK_LINKS = [
  { label: 'Go to dashboard', href: '/', icon: 'dashboard' as IconName },
  { label: 'Browse all courses', href: '/courses', icon: 'courses' as IconName },
  { label: 'Material library', href: '/materials', icon: 'materials' as IconName },
  { label: 'Upcoming deadlines', href: '/assignments', icon: 'assignments' as IconName },
  { label: 'Teaching calendar', href: '/calendar', icon: 'calendar' as IconName },
  { label: 'Course archive', href: '/archive', icon: 'archive' as IconName },
]

/** Mounted only while open, so its query state resets on every launch. */
export function CommandPalette({ onClose }: { onClose: () => void }) {
  const { data } = useData()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)

  const results = useMemo(() => globalSearch(data, query, 12), [data, query])
  const items = query.trim()
    ? results.map((r) => ({ key: r.id, label: r.title, hint: r.subtitle, href: r.href, icon: KIND_ICON[r.kind] }))
    : QUICK_LINKS.map((l) => ({ key: l.href, label: l.label, hint: '', href: l.href, icon: l.icon }))

  const go = (href: string) => {
    navigate(href)
    onClose()
  }

  return (
    <div
      className="modal-backdrop palette-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="palette" role="dialog" aria-modal="true" aria-label="Search">
        <div className="palette__input">
          <Icon name="search" size={18} />
          {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
          <input
            autoFocus
            value={query}
            placeholder="Search courses, materials, assignments, people…"
            onChange={(event) => {
              setQuery(event.target.value)
              setCursor(0)
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault()
                setCursor((c) => Math.min(c + 1, items.length - 1))
              } else if (event.key === 'ArrowUp') {
                event.preventDefault()
                setCursor((c) => Math.max(c - 1, 0))
              } else if (event.key === 'Enter' && items[cursor]) {
                go(items[cursor].href)
              } else if (event.key === 'Escape') {
                onClose()
              }
            }}
          />
          <kbd>esc</kbd>
        </div>

        <div className="palette__results">
          {items.length === 0 ? (
            <p className="palette__empty">No matches for “{query}”.</p>
          ) : (
            items.map((item, index) => (
              <button
                key={item.key}
                className={`palette__item${index === cursor ? ' is-active' : ''}`}
                onMouseEnter={() => setCursor(index)}
                onClick={() => go(item.href)}
              >
                <Icon name={item.icon} size={16} />
                <span className="palette__item-text">
                  <strong>{item.label}</strong>
                  {item.hint && <span>{item.hint}</span>}
                </span>
                <Icon name="chevronRight" size={14} />
              </button>
            ))
          )}
        </div>

        {query.trim() && (
          <button className="palette__footer" onClick={() => go(`/search?q=${encodeURIComponent(query)}`)}>
            See all results for “{query}”
          </button>
        )}
      </div>
    </div>
  )
}
