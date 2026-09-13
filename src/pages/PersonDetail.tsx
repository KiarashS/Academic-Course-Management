import { Link, useParams } from 'react-router-dom'
import { useData } from '../store/DataProvider'
import { byId, courseStats, semesterLabel } from '../lib/selectors'
import { formatDate, pluralize, relativeTime } from '../lib/format'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'
import { Icon } from '../components/ui/Icon'
import { EmptyState } from '../components/ui/EmptyState'
import { CourseCard } from '../components/courses/CourseCard'
import { materialIcon } from '../components/materials/MaterialForm'

export function PersonDetail() {
  const { personId = '' } = useParams()
  const { data } = useData()
  const person = byId(data.people, personId)

  if (!person) {
    return (
      <div className="page">
        <EmptyState
          icon="people"
          title="Person not found"
          description="This profile is no longer in the directory."
          action={
            <Link className="btn btn--primary" to="/people">
              Back to directory
            </Link>
          }
        />
      </div>
    )
  }

  const leading = data.courses.filter((c) => c.professorIds.includes(person.id))
  const assisting = data.courses.filter((c) => c.taIds.includes(person.id))
  const courses = [...leading, ...assisting]
  const active = courses.filter((c) => c.status !== 'archived')
  const uploads = data.materials
    .filter((m) => m.authorId === person.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const authored = data.assignments.filter((a) => a.authorId === person.id)
  const students = active.reduce((sum, course) => sum + course.enrolled, 0)
  const downloads = uploads.reduce((sum, m) => sum + m.downloads, 0)

  return (
    <div className="page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/people">People</Link>
        <Icon name="chevronRight" size={13} />
        <span>{person.name}</span>
      </nav>

      <header className="card card--padded profile-hero">
        <Avatar person={person} size="xl" />
        <div className="profile-hero__body">
          <h1>{person.name}</h1>
          <p className="muted-text">{person.title ?? person.email}</p>
          {person.bio && <p className="prose">{person.bio}</p>}
          <div className="row" style={{ gap: 'var(--space-2)' }}>
            <Badge tone={person.role === 'professor' ? 'accent' : person.role === 'ta' ? 'info' : 'neutral'}>
              {person.role === 'ta' ? 'Teaching assistant' : person.role}
            </Badge>
            {person.department && <Badge>{person.department}</Badge>}
          </div>
          <div className="profile-hero__contact">
            <a href={`mailto:${person.email}`} className="link-muted">
              <Icon name="mail" size={14} /> {person.email}
            </a>
            {person.phone && (
              <span>
                <Icon name="clock" size={14} /> {person.phone}
              </span>
            )}
            {person.office && (
              <span>
                <Icon name="mapPin" size={14} /> {person.office}
              </span>
            )}
            {person.officeHours && (
              <span>
                <Icon name="clock" size={14} /> {person.officeHours}
              </span>
            )}
            {person.website && (
              <a href={person.website} target="_blank" rel="noreferrer noopener" className="link-muted">
                <Icon name="external" size={14} /> Personal page
              </a>
            )}
          </div>
        </div>
      </header>

      <section className="grid grid--stats">
        <div className="stat">
          <span className="stat__label">Active courses</span>
          <span className="stat__value">{active.length}</span>
          <span className="stat__hint">
            {leading.length} led · {assisting.length} assisted
          </span>
        </div>
        <div className="stat">
          <span className="stat__label">Students</span>
          <span className="stat__value">{students}</span>
          <span className="stat__hint">Across active enrolment lists</span>
        </div>
        <div className="stat">
          <span className="stat__label">Materials uploaded</span>
          <span className="stat__value">{uploads.length}</span>
          <span className="stat__hint">{downloads} downloads in total</span>
        </div>
        <div className="stat">
          <span className="stat__label">Assignments authored</span>
          <span className="stat__value">{authored.length}</span>
          <span className="stat__hint">
            {authored.filter((a) => a.published).length} published
          </span>
        </div>
      </section>

      <section className="stack">
        <h2>Courses</h2>
        {courses.length === 0 ? (
          <EmptyState icon="courses" title="No course assignments" />
        ) : (
          <div className="grid grid--cards">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </section>

      {uploads.length > 0 && (
        <section className="card">
          <div className="card__header">
            <div>
              <h3>Recent uploads</h3>
              <p>{pluralize(uploads.length, 'item')} contributed to the library.</p>
            </div>
          </div>
          <ul className="compact-list">
            {uploads.slice(0, 8).map((material) => {
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
                        {course?.code} · {relativeTime(material.createdAt)} · {material.downloads} downloads
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {leading.length > 0 && (
        <section className="card">
          <div className="card__header">
            <div>
              <h3>Teaching load</h3>
              <p>Courses where {person.name.split(' ')[0]} is the lead instructor.</p>
            </div>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Semester</th>
                  <th className="numeric">Credits</th>
                  <th className="numeric">Enrolled</th>
                  <th className="numeric">Materials</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {leading.map((course) => (
                  <tr key={course.id}>
                    <td>
                      <Link to={`/courses/${course.id}`} className="link-strong">
                        {course.code} — {course.title}
                      </Link>
                    </td>
                    <td>{semesterLabel(byId(data.semesters, course.semesterId))}</td>
                    <td className="numeric">{course.credits}</td>
                    <td className="numeric">{course.enrolled}</td>
                    <td className="numeric">{courseStats(data, course.id).materials}</td>
                    <td>{formatDate(course.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
