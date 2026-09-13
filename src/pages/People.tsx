import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Person, Role } from '../types'
import { useData } from '../store/DataProvider'
import { useSession } from '../store/session'
import { useToast } from '../store/ToastProvider'
import { pluralize } from '../lib/format'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { Menu } from '../components/ui/Menu'
import { EmptyState } from '../components/ui/EmptyState'
import { ConfirmDialog, Modal } from '../components/ui/Modal'
import { SelectField, TextAreaField, TextField } from '../components/ui/Field'

const AVATAR_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#f43f5e', '#14b8a6']

const ROLE_LABEL: Record<Role, string> = {
  professor: 'Professor',
  ta: 'Teaching assistant',
  student: 'Student',
}

export function People() {
  const store = useData()
  const { data } = store
  const { canManageTaxonomy } = useSession()
  const { notify } = useToast()
  const [query, setQuery] = useState('')
  const [role, setRole] = useState<Role | ''>('')
  const [form, setForm] = useState<{ open: boolean; person?: Person }>({ open: false })
  const [confirm, setConfirm] = useState<Person | null>(null)

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
  }, [data.people, query, role])

  const courseCount = (personId: string) =>
    data.courses.filter((c) => c.professorIds.includes(personId) || c.taIds.includes(personId)).length

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="page-header__eyebrow">Directory</p>
          <h1>People</h1>
          <p>Professors, teaching assistants, and the courses each of them is attached to.</p>
        </div>
        {canManageTaxonomy && (
          <div className="page-header__actions">
            <Button variant="primary" icon="plus" onClick={() => setForm({ open: true })}>
              Add person
            </Button>
          </div>
        )}
      </header>

      <section className="filter-bar card">
        <div className="filter-bar__search">
          <Icon name="search" size={16} />
          <input
            className="filter-bar__input"
            placeholder="Search by name, email, or department…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="segmented" role="group" aria-label="Role">
          {(['', 'professor', 'ta', 'student'] as const).map((value) => (
            <button key={value || 'all'} aria-pressed={role === value} onClick={() => setRole(value)}>
              {value === '' ? 'Everyone' : ROLE_LABEL[value] + 's'}
            </button>
          ))}
        </div>
      </section>

      <p className="muted-text">{pluralize(people.length, 'person', 'people')}</p>

      {people.length === 0 ? (
        <EmptyState icon="people" title="No one matches" description="Try a different search term." />
      ) : (
        <div className="grid grid--cards">
          {people.map((person) => (
            <div key={person.id} className="card card--padded person-tile">
              <div className="person-tile__head">
                <Link to={`/people/${person.id}`}>
                  <Avatar person={person} size="lg" />
                  <span>
                    <strong className="person-tile__name">{person.name}</strong>
                    <span className="muted-text">{person.title ?? ROLE_LABEL[person.role]}</span>
                  </span>
                </Link>
                {canManageTaxonomy && (
                  <Menu label={`Actions for ${person.name}`}>
                    {(close) => (
                      <>
                        <button
                          onClick={() => {
                            setForm({ open: true, person })
                            close()
                          }}
                        >
                          <Icon name="edit" size={15} /> Edit profile
                        </button>
                        <button
                          className="is-danger"
                          onClick={() => {
                            setConfirm(person)
                            close()
                          }}
                        >
                          <Icon name="trash" size={15} /> Remove
                        </button>
                      </>
                    )}
                  </Menu>
                )}
              </div>

              <div className="person-tile__meta">
                <a href={`mailto:${person.email}`} className="link-muted">
                  <Icon name="mail" size={13} /> {person.email}
                </a>
                {person.office && (
                  <span>
                    <Icon name="mapPin" size={13} /> {person.office}
                  </span>
                )}
                {person.officeHours && (
                  <span>
                    <Icon name="clock" size={13} /> {person.officeHours}
                  </span>
                )}
              </div>

              <div className="row" style={{ gap: 'var(--space-2)' }}>
                <Badge tone={person.role === 'professor' ? 'accent' : person.role === 'ta' ? 'info' : 'neutral'}>
                  {ROLE_LABEL[person.role]}
                </Badge>
                {person.department && <Badge>{person.department}</Badge>}
                <Badge>{pluralize(courseCount(person.id), 'course')}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {form.open && (
        <PersonModal
          person={form.person}
          onClose={() => setForm({ open: false })}
          onSubmit={(values) => {
            if (form.person) {
              store.updatePerson(form.person.id, values)
              notify('Profile updated.')
            } else {
              store.addPerson(values)
              notify(`${values.name} added to the directory.`)
            }
            setForm({ open: false })
          }}
        />
      )}

      <ConfirmDialog
        open={confirm !== null}
        title={`Remove ${confirm?.name ?? ''}?`}
        message="They are unassigned from every course they teach or assist. Course content is kept."
        confirmLabel="Remove"
        onConfirm={() => {
          if (confirm) {
            store.deletePerson(confirm.id)
            notify(`${confirm.name} removed.`, 'error')
          }
        }}
        onClose={() => setConfirm(null)}
      />
    </div>
  )
}

function PersonModal({
  person,
  onClose,
  onSubmit,
}: {
  person?: Person
  onClose: () => void
  onSubmit: (values: Omit<Person, 'id'>) => void
}) {
  const [values, setValues] = useState<Omit<Person, 'id'>>(
    () =>
      person ?? {
        name: '',
        email: '',
        role: 'ta',
        title: '',
        department: '',
        office: '',
        officeHours: '',
        phone: '',
        bio: '',
        avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
        website: '',
      },
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = <K extends keyof Omit<Person, 'id'>>(key: K, value: Omit<Person, 'id'>[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }))

  const submit = () => {
    const nextErrors: Record<string, string> = {}
    if (!values.name.trim()) nextErrors.name = 'A name is required.'
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email)) nextErrors.email = 'Enter a valid email address.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    onSubmit({ ...values, name: values.name.trim(), email: values.email.trim() })
  }

  return (
    <Modal
      open
      title={person ? `Edit ${person.name}` : 'Add a person'}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>
            {person ? 'Save profile' : 'Add person'}
          </Button>
        </>
      }
    >
      <div className="field-grid">
        <TextField
          label="Full name"
          value={values.name}
          error={errors.name}
          onChange={(event) => set('name', event.target.value)}
        />
        <TextField
          label="Email"
          type="email"
          value={values.email}
          error={errors.email}
          onChange={(event) => set('email', event.target.value)}
        />
        <SelectField label="Role" value={values.role} onChange={(event) => set('role', event.target.value as Role)}>
          <option value="professor">Professor</option>
          <option value="ta">Teaching assistant</option>
          <option value="student">Student</option>
        </SelectField>
        <TextField
          label="Title"
          placeholder="Associate Professor of Computer Engineering"
          value={values.title ?? ''}
          onChange={(event) => set('title', event.target.value)}
        />
        <TextField
          label="Department"
          value={values.department ?? ''}
          onChange={(event) => set('department', event.target.value)}
        />
        <TextField
          label="Office"
          value={values.office ?? ''}
          onChange={(event) => set('office', event.target.value)}
        />
        <TextField
          label="Office hours"
          placeholder="Mon & Wed 14:00–16:00"
          value={values.officeHours ?? ''}
          onChange={(event) => set('officeHours', event.target.value)}
        />
        <TextField
          label="Phone"
          value={values.phone ?? ''}
          onChange={(event) => set('phone', event.target.value)}
        />
      </div>

      <TextAreaField
        label="Biography"
        style={{ minHeight: 72 }}
        value={values.bio ?? ''}
        onChange={(event) => set('bio', event.target.value)}
      />

      <div className="field">
        <span className="field__label">Avatar colour</span>
        <div className="chip-row">
          {AVATAR_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`swatch${values.avatarColor === color ? ' is-selected' : ''}`}
              style={{ background: color }}
              aria-label={`Use ${color}`}
              aria-pressed={values.avatarColor === color}
              onClick={() => set('avatarColor', color)}
            />
          ))}
        </div>
      </div>
    </Modal>
  )
}
