import { initials } from '../../lib/format'
import type { Person } from '../../types'

export function Avatar({
  person,
  size = 'md',
}: {
  person: Pick<Person, 'name' | 'avatarColor'>
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  return (
    <span
      className={`avatar${size === 'md' ? '' : ` avatar--${size}`}`}
      style={{ background: person.avatarColor }}
      title={person.name}
      aria-hidden="true"
    >
      {initials(person.name)}
    </span>
  )
}

export function AvatarStack({
  people,
  max = 4,
}: {
  people: Pick<Person, 'id' | 'name' | 'avatarColor'>[]
  max?: number
}) {
  const shown = people.slice(0, max)
  const extra = people.length - shown.length
  return (
    <span className="avatar-stack">
      {shown.map((person) => (
        <Avatar key={person.id} person={person} size="sm" />
      ))}
      {extra > 0 && (
        <span className="avatar avatar--sm" style={{ background: 'var(--fg-subtle)' }}>
          +{extra}
        </span>
      )}
    </span>
  )
}
