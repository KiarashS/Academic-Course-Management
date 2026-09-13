import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { data } from '../content'
import { pluralize } from '../lib/format'
import { ASSIGNMENT_TYPES } from '../lib/contentTypes'
import { AssignmentRow } from '../components/assignments/AssignmentRow'
import { EmptyState } from '../components/ui/EmptyState'

type Window = 'upcoming' | 'week' | 'closed' | 'all'

const WINDOWS: { id: Window; label: string }[] = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'week', label: 'Next 7 days' },
  { id: 'closed', label: 'Closed' },
  { id: 'all', label: 'Everything' },
]

export function Assignments() {
  const [params, setParams] = useSearchParams()
  const window = (params.get('when') as Window) ?? 'upcoming'
  const type = params.get('type') ?? ''
  const courseId = params.get('course') ?? ''

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const assignments = useMemo(() => {
    const nowMs = Date.now()
    const weekMs = nowMs + 7 * 86_400_000
    const filtered = data.assignments.filter((assignment) => {
      if (type && assignment.type !== type) return false
      if (courseId && assignment.courseId !== courseId) return false
      const due = new Date(assignment.dueDate).getTime()
      if (window === 'upcoming') return due >= nowMs
      if (window === 'week') return due >= nowMs && due <= weekMs
      if (window === 'closed') return due < nowMs
      return true
    })
    return filtered.sort((a, b) =>
      window === 'closed' ? b.dueDate.localeCompare(a.dueDate) : a.dueDate.localeCompare(b.dueDate),
    )
  }, [window, type, courseId])

  const stats = useMemo(() => {
    const nowMs = Date.now()
    const published = data.assignments
    return {
      open: published.filter((a) => new Date(a.dueDate).getTime() >= nowMs).length,
      week: published.filter((a) => {
        const due = new Date(a.dueDate).getTime()
        return due >= nowMs && due <= nowMs + 7 * 86_400_000
      }).length,
      total: published.length,
    }
  }, [])

  return (
    <div className="d-container">
      <div className="page-title">
        <div>
          <h1>Coursework</h1>
          <p>
            Homework, labs, quizzes, projects, and exams across every course, on one timeline.
            Deadlines are shown in your own time zone.
          </p>
        </div>
      </div>

      <div className="d-row d-row--between">
        <ul className="nav-pills">
          {WINDOWS.map((item) => (
            <li key={item.id}>
              <button
                className={window === item.id ? 'is-active' : undefined}
                onClick={() => setParam('when', item.id === 'upcoming' ? '' : item.id)}
              >
                {item.label}
                {item.id === 'upcoming' && <span className="nav-pills__count">{stats.open}</span>}
                {item.id === 'week' && <span className="nav-pills__count">{stats.week}</span>}
                {item.id === 'all' && <span className="nav-pills__count">{stats.total}</span>}
              </button>
            </li>
          ))}
        </ul>

        <div className="d-row">
          <select
            className="d-input"
            value={type}
            aria-label="Type"
            onChange={(event) => setParam('type', event.target.value)}
          >
            <option value="">All types</option>
            {ASSIGNMENT_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            className="d-input"
            value={courseId}
            aria-label="Course"
            onChange={(event) => setParam('course', event.target.value)}
          >
            <option value="">All courses</option>
            {data.courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="muted">{pluralize(assignments.length, 'item')}</p>

      {assignments.length === 0 ? (
        <EmptyState
          icon="assignments"
          title="Nothing in this window"
          description="Switch tabs or clear the course filter."
          action={
            <Link className="btn" to="/assignments?when=all">
              Show everything
            </Link>
          }
        />
      ) : (
        <section className="panel">
          <ul className="material-list">
            {assignments.map((assignment) => (
              <AssignmentRow key={assignment.id} assignment={assignment} showCourse />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
