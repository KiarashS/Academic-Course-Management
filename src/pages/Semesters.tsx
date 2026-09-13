import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Semester, SemesterTerm } from '../types'
import { useData } from '../store/DataProvider'
import { useSession } from '../store/session'
import { useToast } from '../store/ToastProvider'
import { formatDateRange, pluralize } from '../lib/format'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { Badge } from '../components/ui/Badge'
import { Menu } from '../components/ui/Menu'
import { ConfirmDialog, Modal } from '../components/ui/Modal'
import { SelectField, TextField } from '../components/ui/Field'

export function Semesters() {
  const store = useData()
  const { data } = store
  const { canManageTaxonomy } = useSession()
  const { notify } = useToast()
  const [form, setForm] = useState<{ open: boolean; semester?: Semester }>({ open: false })
  const [confirm, setConfirm] = useState<Semester | null>(null)

  const semesters = [...data.semesters].sort((a, b) => b.startDate.localeCompare(a.startDate))

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="page-header__eyebrow">Academic calendar</p>
          <h1>Semesters</h1>
          <p>
            Terms group courses for filtering and archiving. Exactly one semester is marked current;
            new courses default to it.
          </p>
        </div>
        {canManageTaxonomy && (
          <div className="page-header__actions">
            <Button variant="primary" icon="plus" onClick={() => setForm({ open: true })}>
              New semester
            </Button>
          </div>
        )}
      </header>

      <div className="stack--tight">
        {semesters.map((semester) => {
          const courses = data.courses.filter((c) => c.semesterId === semester.id)
          const active = courses.filter((c) => c.status !== 'archived')
          const students = active.reduce((sum, c) => sum + c.enrolled, 0)
          return (
            <article key={semester.id} className="card card--padded semester-row">
              <div className="semester-row__main">
                <div className="row" style={{ gap: 'var(--space-2)' }}>
                  <h3>
                    {semester.term} {semester.year}
                  </h3>
                  {semester.current && (
                    <Badge tone="success" dot>
                      Current
                    </Badge>
                  )}
                </div>
                <p className="muted-text">{formatDateRange(semester.startDate, semester.endDate)}</p>
                <div className="semester-row__stats">
                  <span>
                    <Icon name="courses" size={13} /> {pluralize(courses.length, 'course')}
                  </span>
                  <span>
                    <Icon name="archive" size={13} /> {courses.length - active.length} archived
                  </span>
                  <span>
                    <Icon name="users" size={13} /> {students} enrolled
                  </span>
                </div>
              </div>

              <div className="semester-row__courses">
                {active.slice(0, 6).map((course) => (
                  <Link
                    key={course.id}
                    to={`/courses/${course.id}`}
                    className="course-chip"
                    style={{ borderColor: course.color, color: course.color }}
                  >
                    {course.code}
                  </Link>
                ))}
                {active.length > 6 && <span className="muted-text">+{active.length - 6}</span>}
              </div>

              <div className="row" style={{ gap: 'var(--space-2)' }}>
                <Link className="btn btn--secondary btn--sm" to={`/courses?semester=${semester.id}`}>
                  View courses
                </Link>
                {canManageTaxonomy && (
                  <Menu label={`Actions for ${semester.term} ${semester.year}`}>
                    {(close) => (
                      <>
                        <button
                          onClick={() => {
                            setForm({ open: true, semester })
                            close()
                          }}
                        >
                          <Icon name="edit" size={15} /> Edit dates
                        </button>
                        {!semester.current && (
                          <button
                            onClick={() => {
                              store.setCurrentSemester(semester.id)
                              close()
                              notify(`${semester.term} ${semester.year} is now the current semester.`)
                            }}
                          >
                            <Icon name="check" size={15} /> Mark as current
                          </button>
                        )}
                        <div className="menu__divider" />
                        <button
                          className="is-danger"
                          disabled={courses.length > 0}
                          onClick={() => {
                            setConfirm(semester)
                            close()
                          }}
                        >
                          <Icon name="trash" size={15} /> Delete
                        </button>
                      </>
                    )}
                  </Menu>
                )}
              </div>
            </article>
          )
        })}
      </div>

      {form.open && (
        <SemesterModal
          semester={form.semester}
          onClose={() => setForm({ open: false })}
          onSubmit={(values) => {
            if (form.semester) {
              store.updateSemester(form.semester.id, values)
              notify('Semester updated.')
            } else {
              const created = store.addSemester(values)
              if (values.current) store.setCurrentSemester(created.id)
              notify(`${values.term} ${values.year} added.`)
            }
            setForm({ open: false })
          }}
        />
      )}

      <ConfirmDialog
        open={confirm !== null}
        title={`Delete ${confirm?.term} ${confirm?.year}?`}
        message="Only empty semesters can be deleted, so no course data is affected."
        onConfirm={() => {
          if (confirm) {
            store.deleteSemester(confirm.id)
            notify('Semester deleted.', 'error')
          }
        }}
        onClose={() => setConfirm(null)}
      />
    </div>
  )
}

const toDateInput = (iso: string) => (iso ? iso.slice(0, 10) : '')

function SemesterModal({
  semester,
  onClose,
  onSubmit,
}: {
  semester?: Semester
  onClose: () => void
  onSubmit: (values: Omit<Semester, 'id'>) => void
}) {
  const [values, setValues] = useState<Omit<Semester, 'id'>>(
    () =>
      semester ?? {
        term: 'Fall',
        year: new Date().getFullYear(),
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 120 * 86_400_000).toISOString(),
        current: false,
      },
  )
  const [error, setError] = useState('')

  const set = <K extends keyof Omit<Semester, 'id'>>(key: K, value: Omit<Semester, 'id'>[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }))

  return (
    <Modal
      open
      size="narrow"
      title={semester ? `Edit ${semester.term} ${semester.year}` : 'New semester'}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => {
              if (new Date(values.endDate) <= new Date(values.startDate)) {
                setError('The end date must come after the start date.')
                return
              }
              onSubmit(values)
            }}
          >
            {semester ? 'Save' : 'Create semester'}
          </Button>
        </>
      }
    >
      <div className="field-grid">
        <SelectField
          label="Term"
          value={values.term}
          onChange={(event) => set('term', event.target.value as SemesterTerm)}
        >
          <option value="Fall">Fall</option>
          <option value="Spring">Spring</option>
          <option value="Summer">Summer</option>
          <option value="Winter">Winter</option>
        </SelectField>
        <TextField
          label="Year"
          type="number"
          min={2000}
          max={2100}
          value={values.year}
          onChange={(event) => set('year', Number(event.target.value))}
        />
        <TextField
          label="Starts"
          type="date"
          value={toDateInput(values.startDate)}
          onChange={(event) => set('startDate', new Date(event.target.value).toISOString())}
        />
        <TextField
          label="Ends"
          type="date"
          error={error}
          value={toDateInput(values.endDate)}
          onChange={(event) => set('endDate', new Date(event.target.value).toISOString())}
        />
      </div>
    </Modal>
  )
}
