import { Link, useParams } from 'react-router-dom'
import { data } from '../content'
import { byId } from '../lib/selectors'
import { pluralize, relativeTime } from '../lib/format'
import { Avatar } from '../components/ui/Avatar'
import { StatusPill } from '../components/ui/Badge'
import { CourseTable } from '../components/courses/CourseRow'
import { EmptyState } from '../components/ui/EmptyState'
import { Icon } from '../components/ui/Icon'
import { materialIcon } from '../lib/contentTypes'

export function PersonDetail() {
  const { personId = '' } = useParams()
  const person = byId(data.people, personId)

  if (!person) {
    return (
      <EmptyState
        icon="people"
        title="Person not found"
        action={
          <Link className="btn btn--primary" to="/people">
            Back to people
          </Link>
        }
      />
    )
  }

  const leading = data.courses.filter((c) => c.professorIds.includes(person.id))
  const assisting = data.courses.filter((c) => c.taIds.includes(person.id))
  const courses = [...leading, ...assisting]
  const uploads = data.materials
    .filter((m) => m.authorId === person.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div className="d-container">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/people">People</Link>
        <Icon name="chevronRight" size={12} />
        <span>{person.name}</span>
      </nav>

      <header className="profile-header">
        <Avatar person={person} size="huge" />
        <div className="profile-header__body">
          <h1>{person.name}</h1>
          <p className="muted">{person.title ?? person.email}</p>
          <div className="d-row">
            <StatusPill tone={person.role === 'professor' ? 'info' : 'neutral'} plain>
              {person.role === 'ta' ? 'Teaching assistant' : person.role === 'professor' ? 'Instructor' : 'Student'}
            </StatusPill>
            {person.department && <StatusPill plain>{person.department}</StatusPill>}
          </div>
          {person.bio && <p className="profile-header__bio">{person.bio}</p>}
          <div className="profile-header__contact">
            {person.email && (
              <a href={`mailto:${person.email}`}>
                <Icon name="mail" size={14} /> {person.email}
              </a>
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
              <a href={person.website} target="_blank" rel="noreferrer noopener">
                <Icon name="external" size={14} /> Personal page
              </a>
            )}
          </div>
        </div>
      </header>

      {courses.length > 0 ? (
        <>
          <h2 className="section-heading">
            Courses <span className="muted">{courses.length}</span>
          </h2>
          <CourseTable courses={courses} />
        </>
      ) : (
        <EmptyState icon="courses" title="No courses listed" />
      )}

      {uploads.length > 0 && (
        <section className="panel">
          <div className="panel__header">
            <h2>Contributed material</h2>
            <span className="muted">{pluralize(uploads.length, 'item')}</span>
          </div>
          <ul className="panel__list">
            {uploads.slice(0, 10).map((material) => {
              const course = byId(data.courses, material.courseId)
              return (
                <li key={material.id}>
                  <Link
                    className="mini-item"
                    to={`/courses/${material.courseId}?tab=materials&focus=${material.id}`}
                  >
                    <Icon name={materialIcon(material.type)} size={16} />
                    <span className="mini-item__body">
                      <strong>{material.title}</strong>
                      <span>
                        {course?.code} · {relativeTime(material.createdAt)}
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
