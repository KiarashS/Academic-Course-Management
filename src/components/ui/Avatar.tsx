import { initials } from '../../lib/format'
import type { Person } from '../../types'

export function Avatar({
  person,
  size = 'small',
}: {
  person: Pick<Person, 'name' | 'avatarColor'>
  size?: 'small' | 'large' | 'huge'
}) {
  return (
    <span
      className={`avatar${size === 'small' ? '' : ` avatar--${size}`}`}
      style={{ background: person.avatarColor }}
      title={person.name}
      aria-hidden="true"
    >
      {initials(person.name)}
    </span>
  )
}

export function AvatarGroup({
  people,
  max = 4,
}: {
  people: Pick<Person, 'id' | 'name' | 'avatarColor'>[]
  max?: number
}) {
  const shown = people.slice(0, max)
  const extra = people.length - shown.length
  return (
    <span className="avatar-group">
      {shown.map((person) => (
        <Avatar key={person.id} person={person} />
      ))}
      {extra > 0 && (
        <span className="avatar" style={{ background: 'var(--primary-low-mid)' }}>
          +{extra}
        </span>
      )}
    </span>
  )
}
