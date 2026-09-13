import { useState } from 'react'
import type { Tag } from '../../types'
import { Icon } from './Icon'

const SWATCHES = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#f43f5e', '#14b8a6']

export function TagPicker({
  tags,
  selected,
  onChange,
  onCreate,
}: {
  tags: Tag[]
  selected: string[]
  onChange: (ids: string[]) => void
  onCreate?: (name: string, color: string) => Tag
}) {
  const [draft, setDraft] = useState('')

  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((t) => t !== id) : [...selected, id])

  const create = () => {
    const name = draft.trim()
    if (!name || !onCreate) return
    const color = SWATCHES[tags.length % SWATCHES.length]
    const tag = onCreate(name.toLowerCase().replace(/\s+/g, '-'), color)
    if (!selected.includes(tag.id)) onChange([...selected, tag.id])
    setDraft('')
  }

  return (
    <div className="field">
      <span className="field__label">Tags</span>
      <div className="chip-row">
        {tags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            className={`tag-pill${selected.includes(tag.id) ? ' is-selected' : ''}`}
            onClick={() => toggle(tag.id)}
            aria-pressed={selected.includes(tag.id)}
          >
            <span className="tag-pill__swatch" style={{ background: tag.color }} />
            {tag.name}
          </button>
        ))}
      </div>
      {onCreate && (
        <div className="row" style={{ gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
          <input
            className="input"
            style={{ maxWidth: 220 }}
            placeholder="New tag…"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                create()
              }
            }}
          />
          <button type="button" className="btn btn--secondary btn--sm" onClick={create} disabled={!draft.trim()}>
            <Icon name="plus" size={14} />
            Add tag
          </button>
        </div>
      )}
    </div>
  )
}

export function TagList({ tags, max }: { tags: Tag[]; max?: number }) {
  const shown = max ? tags.slice(0, max) : tags
  const extra = tags.length - shown.length
  if (tags.length === 0) return null
  return (
    <span className="chip-row">
      {shown.map((tag) => (
        <span key={tag.id} className="tag-pill">
          <span className="tag-pill__swatch" style={{ background: tag.color }} />
          {tag.name}
        </span>
      ))}
      {extra > 0 && <span className="tag-pill">+{extra}</span>}
    </span>
  )
}
