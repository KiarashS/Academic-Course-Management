import { useMemo, useState } from 'react'
import type { Assignment, AssignmentType } from '../types'
import { useData } from '../store/DataProvider'
import { useSession } from '../store/session'
import { useToast } from '../store/ToastProvider'
import { pluralize } from '../lib/format'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { EmptyState } from '../components/ui/EmptyState'
import { ConfirmDialog } from '../components/ui/Modal'
import { AssignmentRow } from '../components/assignments/AssignmentRow'
import { AssignmentForm, ASSIGNMENT_TYPES } from '../components/assignments/AssignmentForm'

type Window = 'upcoming' | 'week' | 'past' | 'drafts' | 'all'

const WINDOWS: { id: Window; label: string }[] = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'week', label: 'Next 7 days' },
  { id: 'past', label: 'Closed' },
  { id: 'drafts', label: 'Drafts' },
  { id: 'all', label: 'Everything' },
]

export function Assignments() {
  const store = useData()
  const { data } = store
  const { user, canManageContent, myCourses } = useSession()
  const { notify } = useToast()

  const [window, setWindow] = useState<Window>('upcoming')
  const [type, setType] = useState<AssignmentType | ''>('')
  const [courseId, setCourseId] = useState('')
  const [onlyMine, setOnlyMine] = useState(false)
  const [form, setForm] = useState<{ open: boolean; assignment?: Assignment }>({ open: false })
  const [confirm, setConfirm] = useState<Assignment | null>(null)

  const assignments = useMemo(() => {
    const nowMs = Date.now()
    const weekMs = nowMs + 7 * 86_400_000
    const myCourseIds = myCourses.map((c) => c.id)
    const filtered = data.assignments.filter((assignment) => {
      const due = new Date(assignment.dueDate).getTime()
      if (type && assignment.type !== type) return false
      if (courseId && assignment.courseId !== courseId) return false
      if (onlyMine && !myCourseIds.includes(assignment.courseId)) return false
      switch (window) {
        case 'upcoming':
          return assignment.published && due >= nowMs
        case 'week':
          return assignment.published && due >= nowMs && due <= weekMs
        case 'past':
          return assignment.published && due < nowMs
        case 'drafts':
          return !assignment.published
        default:
          return true
      }
    })
    return filtered.sort((a, b) =>
      window === 'past' ? b.dueDate.localeCompare(a.dueDate) : a.dueDate.localeCompare(b.dueDate),
    )
  }, [data.assignments, window, type, courseId, onlyMine, myCourses])

  const stats = useMemo(() => {
    const nowMs = Date.now()
    return {
      open: data.assignments.filter((a) => a.published && new Date(a.dueDate).getTime() >= nowMs)
        .length,
      grading: data.assignments.reduce((sum, a) => sum + (a.submissions - a.graded), 0),
      drafts: data.assignments.filter((a) => !a.published).length,
      thisWeek: data.assignments.filter((a) => {
        const due = new Date(a.dueDate).getTime()
        return a.published && due >= nowMs && due <= nowMs + 7 * 86_400_000
      }).length,
    }
  }, [data.assignments])

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="page-header__eyebrow">Coursework</p>
          <h1>Assignments</h1>
          <p>Homework, labs, quizzes, projects, and exams across every course, on one timeline.</p>
        </div>
        <div className="page-header__actions">
          <Button variant="primary" icon="plus" onClick={() => setForm({ open: true })}>
            New assignment
          </Button>
        </div>
      </header>

      <section className="grid grid--stats">
        <div className="stat">
          <span className="stat__label">Open now</span>
          <span className="stat__value">{stats.open}</span>
          <span className="stat__hint">Published with a future deadline</span>
        </div>
        <div className="stat">
          <span className="stat__label">Due this week</span>
          <span className="stat__value">{stats.thisWeek}</span>
          <span className="stat__hint">Within the next seven days</span>
        </div>
        <div className="stat">
          <span className="stat__label">Awaiting grading</span>
          <span className="stat__value">{stats.grading}</span>
          <span className="stat__hint">Submitted but not marked</span>
        </div>
        <div className="stat">
          <span className="stat__label">Drafts</span>
          <span className="stat__value">{stats.drafts}</span>
          <span className="stat__hint">Not yet visible to students</span>
        </div>
      </section>

      <section className="filter-bar card">
        <div className="segmented" role="group" aria-label="Time window">
          {WINDOWS.map((item) => (
            <button
              key={item.id}
              aria-pressed={window === item.id}
              onClick={() => setWindow(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="filter-bar__controls">
          <select
            className="select"
            value={type}
            aria-label="Assignment type"
            onChange={(event) => setType(event.target.value as AssignmentType | '')}
          >
            <option value="">All types</option>
            {ASSIGNMENT_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            className="select"
            value={courseId}
            aria-label="Course"
            onChange={(event) => setCourseId(event.target.value)}
          >
            <option value="">All courses</option>
            {data.courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} — {course.title}
              </option>
            ))}
          </select>
          <Button
            onClick={() => setOnlyMine((value) => !value)}
            aria-pressed={onlyMine}
            variant={onlyMine ? 'primary' : 'secondary'}
            icon="award"
          >
            My courses
          </Button>
        </div>
      </section>

      <p className="muted-text">{pluralize(assignments.length, 'assignment')}</p>

      {assignments.length === 0 ? (
        <EmptyState
          icon="assignments"
          title="Nothing in this window"
          description="Switch to another tab or clear the course filter."
          action={<Button onClick={() => setWindow('all')}>Show everything</Button>}
        />
      ) : (
        <div className="stack--tight">
          {assignments.map((assignment) => {
            const course = data.courses.find((c) => c.id === assignment.courseId)
            return (
              <AssignmentRow
                key={assignment.id}
                assignment={assignment}
                showCourse
                canManage={course ? canManageContent(course) : false}
                onEdit={() => setForm({ open: true, assignment })}
                onTogglePublished={() => {
                  store.updateAssignment(assignment.id, { published: !assignment.published })
                  notify(assignment.published ? 'Unpublished.' : 'Published to students.', 'info')
                }}
                onDelete={() => setConfirm(assignment)}
              />
            )
          })}
        </div>
      )}

      {form.open && (
        <AssignmentForm
          open
          authorId={user.id}
          assignment={form.assignment}
          onClose={() => setForm({ open: false })}
          onSubmit={(values) => {
            if (form.assignment) {
              store.updateAssignment(form.assignment.id, values)
              notify('Assignment updated.')
            } else {
              store.addAssignment(values)
              notify('Assignment created.')
            }
            setForm({ open: false })
          }}
        />
      )}

      <ConfirmDialog
        open={confirm !== null}
        title={`Delete “${confirm?.title ?? ''}”?`}
        message="Submission and grading counts for this assignment go with it."
        onConfirm={() => {
          if (confirm) {
            store.deleteAssignment(confirm.id)
            notify('Assignment deleted.', 'error')
          }
        }}
        onClose={() => setConfirm(null)}
      />

      <p className="muted-text" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <Icon name="alert" size={13} />
        Deadlines use your local time zone.
      </p>
    </div>
  )
}
