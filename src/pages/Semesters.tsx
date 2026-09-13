import { Link } from 'react-router-dom'
import { data } from '../content'
import { courseStats, semesterLabel } from '../lib/selectors'
import { formatDateRange, pluralize } from '../lib/format'
import { StatusPill } from '../components/ui/Badge'
import { Icon } from '../components/ui/Icon'

export function Semesters() {
  const semesters = [...data.semesters].sort((a, b) => b.startDate.localeCompare(a.startDate))

  return (
    <div className="d-container">
      <div className="page-title">
        <div>
          <h1>Semesters</h1>
          <p>Terms group courses for browsing and archiving.</p>
        </div>
      </div>

      <div className="d-stack">
        {semesters.map((semester) => {
          const courses = data.courses.filter((c) => c.semesterId === semester.id)
          const active = courses.filter((c) => c.status !== 'archived')
          const materials = courses.reduce((sum, c) => sum + courseStats(data, c.id).materials, 0)
          const students = active.reduce((sum, c) => sum + c.enrolled, 0)
          return (
            <section className="panel" key={semester.id}>
              <div className="panel__header">
                <div>
                  <h2>
                    {semesterLabel(semester)}{' '}
                    {semester.current && <StatusPill tone="open">Current</StatusPill>}
                  </h2>
                  <p>{formatDateRange(semester.startDate, semester.endDate)}</p>
                </div>
                <Link
                  className="btn btn--small"
                  to={courses.some((c) => c.status !== 'archived')
                    ? `/?semester=${semester.id}`
                    : `/archive?semester=${semester.id}`}
                >
                  View courses
                </Link>
              </div>
              <div className="panel__body">
                <div className="semester-stats">
                  <span>
                    <Icon name="courses" size={13} /> {pluralize(courses.length, 'course')}
                  </span>
                  <span>
                    <Icon name="archive" size={13} /> {courses.length - active.length} archived
                  </span>
                  <span>
                    <Icon name="materials" size={13} /> {pluralize(materials, 'material')}
                  </span>
                  <span>
                    <Icon name="users" size={13} /> {students} enrolled
                  </span>
                </div>
                {courses.length > 0 && (
                  <div className="semester-courses">
                    {courses.map((course) => (
                      <Link
                        key={course.id}
                        to={`/courses/${course.id}`}
                        className="course-chip"
                        style={{ borderColor: course.color, color: course.color }}
                      >
                        {course.code}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
