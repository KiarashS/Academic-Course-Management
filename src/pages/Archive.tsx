import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../store/DataProvider'
import { useSession } from '../store/session'
import { useToast } from '../store/ToastProvider'
import { byId, courseStats, semesterLabel } from '../lib/selectors'
import { formatDate, pluralize } from '../lib/format'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { Badge } from '../components/ui/Badge'
import { AvatarStack } from '../components/ui/Avatar'
import { EmptyState } from '../components/ui/EmptyState'
import { ConfirmDialog } from '../components/ui/Modal'
import { peopleFor } from '../lib/selectors'

export function Archive() {
  const store = useData()
  const { data } = store
  const { canEditCourse } = useSession()
  const { notify } = useToast()
  const [query, setQuery] = useState('')
  const [semesterId, setSemesterId] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const archived = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return data.courses
      .filter((course) => course.status === 'archived')
      .filter((course) => (semesterId ? course.semesterId === semesterId : true))
      .filter((course) =>
        needle ? `${course.code} ${course.title}`.toLowerCase().includes(needle) : true,
      )
      .sort((a, b) => (b.archivedAt ?? b.updatedAt).localeCompare(a.archivedAt ?? a.updatedAt))
  }, [data.courses, query, semesterId])

  const semestersWithArchive = data.semesters.filter((semester) =>
    data.courses.some((c) => c.status === 'archived' && c.semesterId === semester.id),
  )

  const totals = archived.reduce(
    (acc, course) => {
      const stats = courseStats(data, course.id)
      acc.materials += stats.materials
      acc.assignments += stats.assignments
      acc.students += course.enrolled
      return acc
    },
    { materials: 0, assignments: 0, students: 0 },
  )

  const confirmCourse = confirmId ? byId(data.courses, confirmId) : undefined

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="page-header__eyebrow">History</p>
          <h1>Archive</h1>
          <p>
            Finished courses keep their materials, assignments, and enrolment figures. Restore one to
            bring it back into the catalogue, or duplicate it into a new semester from its page.
          </p>
        </div>
      </header>

      <section className="grid grid--stats">
        <div className="stat">
          <span className="stat__label">Archived courses</span>
          <span className="stat__value">{archived.length}</span>
          <span className="stat__hint">Across {pluralize(semestersWithArchive.length, 'semester')}</span>
        </div>
        <div className="stat">
          <span className="stat__label">Materials preserved</span>
          <span className="stat__value">{totals.materials}</span>
          <span className="stat__hint">Still searchable from the library</span>
        </div>
        <div className="stat">
          <span className="stat__label">Assignments kept</span>
          <span className="stat__value">{totals.assignments}</span>
          <span className="stat__hint">Useful as templates for next term</span>
        </div>
        <div className="stat">
          <span className="stat__label">Students taught</span>
          <span className="stat__value">{totals.students}</span>
          <span className="stat__hint">Summed over archived enrolment</span>
        </div>
      </section>

      <section className="filter-bar card">
        <div className="filter-bar__search">
          <Icon name="search" size={16} />
          <input
            className="filter-bar__input"
            placeholder="Search the archive…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="filter-bar__controls">
          <select
            className="select"
            value={semesterId}
            aria-label="Semester"
            onChange={(event) => setSemesterId(event.target.value)}
          >
            <option value="">All semesters</option>
            {semestersWithArchive.map((semester) => (
              <option key={semester.id} value={semester.id}>
                {semester.term} {semester.year}
              </option>
            ))}
          </select>
        </div>
      </section>

      {archived.length === 0 ? (
        <EmptyState
          icon="archive"
          title="The archive is empty"
          description="Courses you archive from a course page appear here."
          action={
            <Link className="btn btn--primary" to="/courses">
              Back to courses
            </Link>
          }
        />
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Semester</th>
                <th>Staff</th>
                <th className="numeric">Materials</th>
                <th className="numeric">Enrolled</th>
                <th>Archived</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {archived.map((course) => {
                const stats = courseStats(data, course.id)
                const staff = peopleFor(data.people, [...course.professorIds, ...course.taIds])
                return (
                  <tr key={course.id}>
                    <td>
                      <Link to={`/courses/${course.id}`} className="link-strong">
                        <span
                          className="course-row__code"
                          style={{ borderColor: course.color, color: course.color }}
                        >
                          {course.code}
                        </span>
                        {course.title}
                      </Link>
                    </td>
                    <td>{semesterLabel(byId(data.semesters, course.semesterId))}</td>
                    <td>
                      <AvatarStack people={staff} max={3} />
                    </td>
                    <td className="numeric">{stats.materials}</td>
                    <td className="numeric">{course.enrolled}</td>
                    <td>
                      <Badge>{course.archivedAt ? formatDate(course.archivedAt) : '—'}</Badge>
                    </td>
                    <td>
                      <div className="table__actions">
                        <Link className="btn btn--ghost btn--sm" to={`/courses/${course.id}`}>
                          Open
                        </Link>
                        {canEditCourse(course) && (
                          <Button size="sm" icon="restore" onClick={() => setConfirmId(course.id)}>
                            Restore
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={confirmCourse !== undefined}
        title={`Restore ${confirmCourse?.code ?? ''}?`}
        message="The course returns to the catalogue as published, with all its content intact."
        confirmLabel="Restore"
        destructive={false}
        onConfirm={() => {
          if (confirmCourse) {
            store.restoreCourse(confirmCourse.id)
            notify(`${confirmCourse.code} restored to the catalogue.`)
          }
        }}
        onClose={() => setConfirmId(null)}
      />
    </div>
  )
}
