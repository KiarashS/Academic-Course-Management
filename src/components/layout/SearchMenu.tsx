import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon, type IconName } from '../ui/Icon'
import { data } from '../../content'
import { globalSearch, type SearchKind } from '../../lib/selectors'

const KIND_ICON: Record<SearchKind, IconName> = {
  course: 'courses',
  material: 'materials',
  assignment: 'assignments',
  person: 'people',
}

const QUICK_LINKS: { label: string; href: string; icon: IconName }[] = [
  { label: 'All courses', href: '/', icon: 'courses' },
  { label: 'Material library', href: '/materials', icon: 'materials' },
  { label: 'Coursework and deadlines', href: '/assignments', icon: 'assignments' },
  { label: 'Calendar', href: '/calendar', icon: 'calendar' },
  { label: 'Categories', href: '/categories', icon: 'category' },
  { label: 'Archive', href: '/archive', icon: 'archive' },
]

/** Mounted only while open, so the query resets on every launch. */
export function SearchMenu({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)

  const results = useMemo(() => globalSearch(data, query, 10), [query])
  const items = query.trim()
    ? results.map((r) => ({
        key: r.kind + r.id,
        label: r.title,
        hint: r.subtitle,
        href: r.href,
        icon: KIND_ICON[r.kind],
      }))
    : QUICK_LINKS.map((l) => ({ key: l.href, label: l.label, hint: '', href: l.href, icon: l.icon }))

  const go = (href: string) => {
    navigate(href)
    onClose()
  }

  return (
    <div
      className="d-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="search-menu" role="dialog" aria-modal="true" aria-label="Search">
        <div className="search-menu__input">
          <Icon name="search" size={18} />
          {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
          <input
            autoFocus
            value={query}
            placeholder="Search courses, materials, coursework, people…"
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
        </div>

        <div className="search-menu__results">
          {items.length === 0 ? (
            <p className="search-menu__empty">No results for “{query}”.</p>
          ) : (
            items.map((item, index) => (
              <button
                key={item.key}
                className={`search-menu__item${index === cursor ? ' is-active' : ''}`}
                onMouseEnter={() => setCursor(index)}
                onClick={() => go(item.href)}
              >
                <Icon name={item.icon} size={16} />
                <span className="search-menu__text">
                  <strong>{item.label}</strong>
                  {item.hint && <span>{item.hint}</span>}
                </span>
              </button>
            ))
          )}
        </div>

        {query.trim() && (
          <button
            className="search-menu__footer"
            onClick={() => go(`/search?q=${encodeURIComponent(query)}`)}
          >
            See all results for “{query}”
          </button>
        )}
      </div>
    </div>
  )
}
