import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { Role } from '../types'
import { data } from '../content'
import { pluralize } from '../lib/format'
import { Avatar } from '../components/ui/Avatar'
import { EmptyState } from '../components/ui/EmptyState'
import { Icon } from '../components/ui/Icon'

const ROLE_LABEL: Record<Role, string> = {
  professor: 'Instructor',
  ta: 'Teaching assistant',
  student: 'Student',
}

export function People() {
  const [params, setParams] = useSearchParams()
  const role = (params.get('role') as Role | null) ?? ''
  const query = params.get('q') ?? ''

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const people = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return data.people
      .filter((person) => {
        if (role && person.role !== role) return false
        if (!needle) return true
        return `${person.name} ${person.email} ${person.department ?? ''} ${person.title ?? ''}`
          .toLowerCase()
          .includes(needle)
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [role, query])

  const courseCount = (id: string) =>
    data.courses.filter((c) => c.professorIds.includes(id) || c.taIds.includes(id)).length

  return (
    <div className="d-container">
      <div className="page-title">
        <div>
          <h1>People</h1>
          <p>Instructors and teaching assistants, and the courses they run.</p>
        </div>
      </div>

      <div className="d-row d-row--between">
        <ul className="nav-pills">
          {([['', 'Everyone'], ['professor', 'Instructors'], ['ta', 'Teaching assistants']] as const).map(
            ([value, label]) => (
              <li key={value || 'all'}>
                <button
                  className={role === value ? 'is-active' : undefined}
                  onClick={() => setParam('role', value)}
                >
                  {label}
                  <span className="nav-pills__count">
                    {value ? data.people.filter((p) => p.role === value).length : data.people.length}
                  </span>
                </button>
              </li>
            ),
          )}
        </ul>

        <div className="search-field" style={{ minWidth: 220 }}>
          <Icon name="search" size={16} />
          <input
            value={query}
            placeholder="Search people…"
            onChange={(event) => setParam('q', event.target.value)}
          />
        </div>
      </div>

      {people.length === 0 ? (
        <EmptyState icon="people" title="Nobody matches" description="Try a different search." />
      ) : (
        <div className="people-grid">
          {people.map((person) => (
            <Link key={person.id} to={`/people/${person.id}`} className="person-card">
              <Avatar person={person} size="large" />
              <div className="person-card__body">
                <strong>{person.name}</strong>
                <span>{person.title ?? ROLE_LABEL[person.role]}</span>
                <span className="muted">
                  {person.department ? `${person.department} · ` : ''}
                  {pluralize(courseCount(person.id), 'course')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
