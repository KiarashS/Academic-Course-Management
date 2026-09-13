import { Link } from 'react-router-dom'
import type { Category, Tag } from '../../types'

/** Discourse's category badge: a small colour chip followed by the name. */
export function CategoryBadge({
  category,
  large = false,
  link = true,
}: {
  category: Category | undefined
  large?: boolean
  link?: boolean
}) {
  if (!category) return null
  const className = `badge-category${large ? ' badge-category--large' : ''}`
  const body = (
    <>
      <span className="badge-category__icon" style={{ background: category.color }} />
      {category.name}
    </>
  )
  return link ? (
    <Link className={className} to={`/categories/${category.id}`}>
      {body}
    </Link>
  ) : (
    <span className={className}>{body}</span>
  )
}

export function TagLink({ tag }: { tag: Tag }) {
  return (
    <Link className="discourse-tag" to={`/tags/${tag.id}`}>
      {tag.name}
    </Link>
  )
}

export function TagRow({ tags, max }: { tags: Tag[]; max?: number }) {
  if (tags.length === 0) return null
  const shown = max ? tags.slice(0, max) : tags
  const extra = tags.length - shown.length
  return (
    <span className="tag-row">
      {shown.map((tag) => (
        <TagLink key={tag.id} tag={tag} />
      ))}
      {extra > 0 && <span className="discourse-tag">+{extra}</span>}
    </span>
  )
}

type Tone = 'open' | 'soon' | 'urgent' | 'info' | 'closed' | 'neutral'

export function StatusPill({
  tone = 'neutral',
  plain = false,
  children,
}: {
  tone?: Tone
  plain?: boolean
  children: React.ReactNode
}) {
  return (
    <span
      className={`status-pill${tone === 'neutral' ? '' : ` status-pill--${tone}`}${
        plain ? ' status-pill--plain' : ''
      }`}
    >
      {children}
    </span>
  )
}
