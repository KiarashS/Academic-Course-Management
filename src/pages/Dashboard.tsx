import { Link } from 'react-router-dom'
import { useData } from '../store/DataProvider'
import { useSession } from '../store/session'
import {
  byId,
  courseStats,
  recentMaterials,
  semesterLabel,
  upcomingAssignments,
} from '../lib/selectors'
import { daysUntil, formatDate, pluralize, relativeTime } from '../lib/format'
import { Icon } from '../components/ui/Icon'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { EmptyState } from '../components/ui/EmptyState'
import { CourseCard } from '../components/courses/CourseCard'
import { materialIcon } from '../components/materials/MaterialForm'
import { dueTone } from '../components/assignments/AssignmentRow'

const greeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function Dashboard() {
  const { data } = useData()
  const { user, myCourses, isStudent } = useSession()

  const teaching = myCourses.filter((c) => c.status !== 'archived')
  const scope = teaching.length > 0 ? teaching.map((c) => c.id) : undefined
  const deadlines = upcomingAssignments(data, 6, scope)
  const materials = recentMaterials(data, 5, scope)
  const currentSemester = data.semesters.find((s) => s.current)

  const totals = teaching.reduce(
    (acc, course) => {
      const stats = courseStats(data, course.id)
      acc.students += course.enrolled
      acc.materials += stats.materials
      acc.grading += data.assignments
        .filter((a) => a.courseId === course.id)
        .reduce((sum, a) => sum + (a.submissions - a.graded), 0)
      return acc
    },
    { students: 0, materials: 0, grading: 0 },
  )

  const announcements = data.announcements
    .filter((a) => !scope || scope.includes(a.courseId))
    .slice()
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4)

  const today = new Date().getDay()
  const todaySessions = teaching
    .flatMap((course) =>
      course.meetingTimes
        .filter((meeting) => meeting.day === today)
        .map((meeting) => ({ course, meeting })),
    )
    .sort((a, b) => a.meeting.start.localeCompare(b.meeting.start))

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="page-header__eyebrow">
            {currentSemester ? semesterLabel(currentSemester) : 'No active semester'} ·{' '}
            {formatDate(new Date())}
          </p>
          <h1>
            {greeting()}, {user.name.replace(/^(Dr|Prof)\.?\s+/i, '')}
          </h1>
          <p>
            {teaching.length > 0
              ? `You are ${isStudent ? 'enrolled in' : 'teaching'} ${teaching.length} ${
                  teaching.length === 1 ? 'course' : 'courses'
                } this term, with ${totals.grading} submissions waiting to be graded.`
              : 'No active courses are assigned to you. Browse the catalogue to see what other faculty are running.'}
          </p>
        </div>
        <div className="page-header__actions">
          <Link className="btn btn--secondary" to="/calendar">
            <Icon name="calendar" size={16} /> Calendar
          </Link>
          <Link className="btn btn--primary" to="/courses">
            <Icon name="courses" size={16} /> All courses
          </Link>
        </div>
      </header>

      <section className="grid grid--stats">
        <div className="stat">
          <span className="stat__label">Active courses</span>
          <span className="stat__value">{teaching.length}</span>
          <span className="stat__hint">
            {pluralize(data.courses.filter((c) => c.status === 'draft').length, 'draft')} across the
            department
          </span>
        </div>
        <div className="stat">
          <span className="stat__label">Students reached</span>
          <span className="stat__value">{totals.students}</span>
          <span className="stat__hint">Summed over your active enrolment lists</span>
        </div>
        <div className="stat">
          <span className="stat__label">Materials published</span>
          <span className="stat__value">{totals.materials}</span>
          <span className="stat__hint">Slides, e-books, recordings, datasets</span>
        </div>
        <div className="stat">
          <span className="stat__label">Awaiting grading</span>
          <span className="stat__value">{totals.grading}</span>
          <span className="stat__hint">Submitted but not yet marked</span>
        </div>
      </section>

      <section className="grid grid--split">
        <div className="stack">
          <div className="card">
            <div className="card__header">
              <div>
                <h3>Upcoming deadlines</h3>
                <p>Published assignments across your courses, soonest first.</p>
              </div>
              <Link className="btn btn--ghost btn--sm" to="/assignments">
                View all <Icon name="chevronRight" size={14} />
              </Link>
            </div>
            {deadlines.length === 0 ? (
              <div className="card__body">
                <EmptyState
                  icon="assignments"
                  title="Nothing due"
                  description="No published assignment has a future deadline right now."
                />
              </div>
            ) : (
              <ul className="deadline-list">
                {deadlines.map((assignment) => {
                  const course = byId(data.courses, assignment.courseId)
                  const days = daysUntil(assignment.dueDate)
                  return (
                    <li key={assignment.id}>
                      <Link
                        to={`/courses/${assignment.courseId}?tab=assignments&focus=${assignment.id}`}
                        className="deadline-item"
                      >
                        <span
                          className="deadline-item__day"
                          style={{ borderColor: course?.color }}
                        >
                          <strong>{new Date(assignment.dueDate).getDate()}</strong>
                          <span>
                            {new Date(assignment.dueDate).toLocaleString(undefined, {
                              month: 'short',
                            })}
                          </span>
                        </span>
                        <span className="deadline-item__body">
                          <strong>{assignment.title}</strong>
                          <span>
                            {course?.code} · {assignment.points} pts ·{' '}
                            {assignment.submissions} submitted
                          </span>
                        </span>
                        <Badge tone={dueTone(assignment)} dot>
                          {days === 0 ? 'Today' : relativeTime(assignment.dueDate)}
                        </Badge>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="card">
            <div className="card__header">
              <div>
                <h3>Recently added materials</h3>
                <p>The newest uploads in the courses you work on.</p>
              </div>
              <Link className="btn btn--ghost btn--sm" to="/materials">
                Library <Icon name="chevronRight" size={14} />
              </Link>
            </div>
            {materials.length === 0 ? (
              <div className="card__body">
                <EmptyState icon="materials" title="No materials yet" />
              </div>
            ) : (
              <ul className="compact-list">
                {materials.map((material) => {
                  const course = byId(data.courses, material.courseId)
                  return (
                    <li key={material.id}>
                      <Link
                        to={`/courses/${material.courseId}?tab=materials&focus=${material.id}`}
                        className="compact-item"
                      >
                        <span className="compact-item__icon">
                          <Icon name={materialIcon(material.type)} size={16} />
                        </span>
                        <span className="compact-item__body">
                          <strong>{material.title}</strong>
                          <span>
                            {course?.code} · {material.type} · {relativeTime(material.createdAt)}
                          </span>
                        </span>
                        {!material.visible && <Badge tone="warning">Hidden</Badge>}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <div className="card__header">
              <div>
                <h3>Today</h3>
                <p>
                  {todaySessions.length === 0
                    ? 'No sessions scheduled.'
                    : `${todaySessions.length} session${todaySessions.length === 1 ? '' : 's'}.`}
                </p>
              </div>
            </div>
            <div className="card__body">
              {todaySessions.length === 0 ? (
                <p className="muted-text">
                  Nothing on the timetable today. Deadlines still apply.
                </p>
              ) : (
                <ul className="session-list">
                  {todaySessions.map(({ course, meeting }, index) => (
                    <li key={`${course.id}-${index}`}>
                      <span className="session-list__time">{meeting.start}</span>
                      <span className="session-list__bar" style={{ background: course.color }} />
                      <span className="session-list__body">
                        <Link to={`/courses/${course.id}`} className="link-strong">
                          {course.code}
                        </Link>
                        <span>
                          {meeting.start}–{meeting.end} · {meeting.room ?? course.location}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card__header">
              <div>
                <h3>Announcements</h3>
                <p>Posted to your courses.</p>
              </div>
            </div>
            {announcements.length === 0 ? (
              <div className="card__body">
                <p className="muted-text">No announcements posted yet.</p>
              </div>
            ) : (
              <ul className="announcement-list">
                {announcements.map((announcement) => {
                  const course = byId(data.courses, announcement.courseId)
                  const author = byId(data.people, announcement.authorId)
                  return (
                    <li key={announcement.id}>
                      <div className="row" style={{ gap: 'var(--space-2)' }}>
                        {author && <Avatar person={author} size="sm" />}
                        <strong>{announcement.title}</strong>
                        {announcement.pinned && (
                          <Badge tone="accent">
                            <Icon name="pin" size={11} /> Pinned
                          </Badge>
                        )}
                      </div>
                      <p>{announcement.body}</p>
                      <span className="muted-text">
                        {course?.code} · {relativeTime(announcement.createdAt)}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="stack">
        <div className="row row--between">
          <h2>Your courses</h2>
          <Link className="btn btn--ghost btn--sm" to="/courses">
            Browse catalogue <Icon name="chevronRight" size={14} />
          </Link>
        </div>
        {teaching.length === 0 ? (
          <EmptyState
            icon="courses"
            title="No courses assigned"
            description="Courses you teach or assist appear here once a professor adds you to them."
          />
        ) : (
          <div className="grid grid--cards">
            {teaching.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
