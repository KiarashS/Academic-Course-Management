import { useEffect, useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { data } from '../content'
import { byId, courseStats, peopleFor, semesterLabel, tagsFor } from '../lib/selectors'
import { dayName, formatDate, pluralize, relativeTime } from '../lib/format'
import { Avatar } from '../components/ui/Avatar'
import { CategoryBadge, StatusPill, TagRow } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { Icon } from '../components/ui/Icon'
import { MaterialRow } from '../components/materials/MaterialRow'
import { AssignmentRow } from '../components/assignments/AssignmentRow'

type Tab = 'about' | 'materials' | 'coursework' | 'announcements' | 'staff'

export function CourseDetail() {
  const { courseId = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab) ?? 'about'
  const focusId = params.get('focus')

  const course = byId(data.courses, courseId)

  const materials = useMemo(
    () =>
      data.materials
        .filter((m) => m.courseId === courseId)
        .sort((a, b) => (a.week ?? 99) - (b.week ?? 99) || a.createdAt.localeCompare(b.createdAt)),
    [courseId],
  )
  const assignments = useMemo(
    () =>
      data.assignments
        .filter((a) => a.courseId === courseId)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [courseId],
  )
  const announcements = useMemo(
    () =>
      data.announcements
        .filter((a) => a.courseId === courseId)
        .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt)),
    [courseId],
  )
  const modules = useMemo(
    () => data.modules.filter((m) => m.courseId === courseId).sort((a, b) => a.order - b.order),
    [courseId],
  )

  useEffect(() => {
    if (!focusId) return
    document.getElementById(`item-${focusId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [focusId, tab])

  if (!course) {
    return (
      <EmptyState
        icon="courses"
        title="Course not found"
        description="It may have been renamed or removed from the content file."
        action={
          <Link className="btn btn--primary" to="/">
            Back to courses
          </Link>
        }
      />
    )
  }

  const stats = courseStats(data, course.id)
  const professors = peopleFor(data.people, course.professorIds)
  const assistants = peopleFor(data.people, course.taIds)
  const semester = byId(data.semesters, course.semesterId)

  const setTab = (next: Tab) => {
    const search = new URLSearchParams(params)
    search.set('tab', next)
    search.delete('focus')
    setParams(search, { replace: true })
  }

  const TABS: { id: Tab; label: string; count?: number }[] = [
    { id: 'about', label: 'About' },
    { id: 'materials', label: 'Materials', count: materials.length },
    { id: 'coursework', label: 'Coursework', count: assignments.length },
    { id: 'announcements', label: 'Announcements', count: announcements.length },
    { id: 'staff', label: 'Staff', count: professors.length + assistants.length },
  ]

  const grouped = [
    ...modules.map((module) => ({
      id: module.id,
      title: module.title,
      summary: module.summary,
      items: materials.filter((m) => m.moduleId === module.id),
    })),
    {
      id: 'unfiled',
      title: 'Other material',
      summary: undefined,
      items: materials.filter((m) => !m.moduleId || !modules.some((mod) => mod.id === m.moduleId)),
    },
  ].filter((group) => group.items.length > 0)

  return (
    <div className="d-container">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Courses</Link>
        <Icon name="chevronRight" size={12} />
        <Link to={`/?semester=${course.semesterId}`}>{semesterLabel(semester)}</Link>
      </nav>

      <header className="topic-header">
        <h1>{course.title}</h1>
        <div className="topic-header__meta">
          <span className="topic-list__code">{course.code}</span>
          <CategoryBadge category={byId(data.categories, course.categoryId)} large />
          <TagRow tags={tagsFor(data.tags, course.tagIds)} />
          {course.status === 'archived' && <StatusPill tone="closed">Archived</StatusPill>}
        </div>
        <div className="topic-header__stats">
          <span>
            <Icon name="award" size={14} /> {pluralize(course.credits, 'credit')}
          </span>
          <span>
            <Icon name="users" size={14} /> {course.enrolled}
            {course.capacity ? `/${course.capacity}` : ''} enrolled
          </span>
          <span>
            <Icon name="materials" size={14} /> {pluralize(stats.materials, 'material')}
          </span>
          {course.location && (
            <span>
              <Icon name="mapPin" size={14} /> {course.location}
            </span>
          )}
          <span>
            <Icon name="clock" size={14} /> Updated {relativeTime(course.updatedAt)}
          </span>
        </div>
      </header>

      <ul className="nav-pills topic-tabs" role="tablist">
        {TABS.map((item) => (
          <li key={item.id}>
            <button
              role="tab"
              aria-selected={tab === item.id}
              className={tab === item.id ? 'is-active' : undefined}
              onClick={() => setTab(item.id)}
            >
              {item.label}
              {item.count !== undefined && <span className="nav-pills__count">{item.count}</span>}
            </button>
          </li>
        ))}
      </ul>

      {tab === 'about' && (
        <div className="d-split">
          <div className="post-stream">
            <article className="post">
              <div>
                {professors[0] && <Avatar person={professors[0]} size="large" />}
              </div>
              <div>
                <div className="post__meta">
                  <span className="post__author">{professors[0]?.name ?? 'Course team'}</span>
                  <span className="post__time">{formatDate(course.createdAt)}</span>
                </div>
                <div className="post__body">
                  <p>{course.description || course.summary}</p>
                </div>
              </div>
            </article>

            {course.objectives.length > 0 && (
              <article className="post">
                <div>
                  <span className="post__glyph">
                    <Icon name="check" size={20} />
                  </span>
                </div>
                <div>
                  <div className="post__meta">
                    <span className="post__author">Learning objectives</span>
                  </div>
                  <div className="post__body">
                    <ul className="bullet-list">
                      {course.objectives.map((objective) => (
                        <li key={objective}>{objective}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            )}

            {modules.length > 0 && (
              <article className="post">
                <div>
                  <span className="post__glyph">
                    <Icon name="semesters" size={20} />
                  </span>
                </div>
                <div>
                  <div className="post__meta">
                    <span className="post__author">Syllabus</span>
                    <span className="post__time">{pluralize(modules.length, 'module')}</span>
                  </div>
                  <div className="post__body">
                    <ol className="module-list">
                      {modules.map((module) => {
                        const count = materials.filter((m) => m.moduleId === module.id).length
                        return (
                          <li key={module.id}>
                            <div>
                              <strong>{module.title}</strong>
                              {module.summary && <span>{module.summary}</span>}
                            </div>
                            <span className="muted">{pluralize(count, 'item')}</span>
                          </li>
                        )
                      })}
                    </ol>
                  </div>
                </div>
              </article>
            )}
          </div>

          <aside className="d-stack">
            {course.meetingTimes.length > 0 && (
              <section className="panel">
                <div className="panel__header">
                  <h2>Timetable</h2>
                </div>
                <ul className="panel__list">
                  {course.meetingTimes.map((meeting, index) => (
                    <li key={index}>
                      <div className="mini-item">
                        <span className="mini-item__body">
                          <strong>{dayName(meeting.day)}</strong>
                          <span>{meeting.room ?? course.location}</span>
                        </span>
                        <span className="muted tabular">
                          {meeting.start}–{meeting.end}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {course.gradingScheme.length > 0 && (
              <section className="panel">
                <div className="panel__header">
                  <h2>Grading</h2>
                </div>
                <div className="panel__body grading">
                  {course.gradingScheme.map((item) => (
                    <div key={item.label} className="grading__row">
                      <div className="d-row d-row--between">
                        <span>{item.label}</span>
                        <strong className="tabular">{item.weight}%</strong>
                      </div>
                      <div className="bar">
                        <div
                          className="bar__fill"
                          style={{ width: `${item.weight}%`, background: course.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {course.prerequisites.length > 0 && (
              <section className="panel">
                <div className="panel__header">
                  <h2>Prerequisites</h2>
                </div>
                <ul className="panel__list">
                  {course.prerequisites.map((item) => (
                    <li key={item}>
                      <div className="mini-item">
                        <span className="mini-item__body">{item}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="panel">
              <div className="panel__header">
                <h2>Details</h2>
              </div>
              <div className="panel__body">
                <dl className="detail-list">
                  <div>
                    <dt>Semester</dt>
                    <dd>{semesterLabel(semester)}</dd>
                  </div>
                  <div>
                    <dt>Level</dt>
                    <dd>{course.level}</dd>
                  </div>
                  <div>
                    <dt>Language</dt>
                    <dd>{course.language}</dd>
                  </div>
                  {course.archivedAt && (
                    <div>
                      <dt>Archived</dt>
                      <dd>{formatDate(course.archivedAt)}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </section>
          </aside>
        </div>
      )}

      {tab === 'materials' && (
        <div className="d-stack">
          {grouped.length === 0 ? (
            <EmptyState icon="materials" title="No materials yet" />
          ) : (
            grouped.map((group) => (
              <section className="panel" key={group.id}>
                <div className="panel__header">
                  <div>
                    <h2>{group.title}</h2>
                    {group.summary && <p>{group.summary}</p>}
                  </div>
                  <span className="muted">{pluralize(group.items.length, 'item')}</span>
                </div>
                <ul className="material-list">
                  {group.items.map((material) => (
                    <div key={material.id} id={`item-${material.id}`}>
                      <MaterialRow material={material} />
                    </div>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      )}

      {tab === 'coursework' && (
        <div className="d-stack">
          {assignments.length === 0 ? (
            <EmptyState icon="assignments" title="No coursework listed" />
          ) : (
            <section className="panel">
              <ul className="material-list">
                {assignments.map((assignment) => (
                  <div key={assignment.id} id={`item-${assignment.id}`}>
                    <AssignmentRow assignment={assignment} />
                  </div>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {tab === 'announcements' && (
        <div className="post-stream">
          {announcements.length === 0 ? (
            <EmptyState icon="megaphone" title="No announcements" />
          ) : (
            announcements.map((announcement) => {
              const author = byId(data.people, announcement.authorId)
              return (
                <article className="post" key={announcement.id}>
                  <div>{author && <Avatar person={author} size="large" />}</div>
                  <div>
                    <div className="post__meta">
                      <span className="post__author">{author?.name}</span>
                      <span className="post__time">{relativeTime(announcement.createdAt)}</span>
                      {announcement.pinned && <StatusPill tone="info">Pinned</StatusPill>}
                    </div>
                    <div className="post__body">
                      <h3 className="post__title">{announcement.title}</h3>
                      <p>{announcement.body}</p>
                    </div>
                  </div>
                </article>
              )
            })
          )}
        </div>
      )}

      {tab === 'staff' && (
        <div className="d-stack">
          {[
            { title: 'Instructors', people: professors },
            { title: 'Teaching assistants', people: assistants },
          ]
            .filter((group) => group.people.length > 0)
            .map((group) => (
              <section className="panel" key={group.title}>
                <div className="panel__header">
                  <h2>{group.title}</h2>
                </div>
                <ul className="panel__list">
                  {group.people.map((person) => (
                    <li key={person.id}>
                      <Link className="person-item" to={`/people/${person.id}`}>
                        <Avatar person={person} size="large" />
                        <span className="person-item__body">
                          <strong>{person.name}</strong>
                          <span>{person.title ?? person.email}</span>
                          {person.officeHours && (
                            <span className="muted">Office hours: {person.officeHours}</span>
                          )}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
        </div>
      )}
    </div>
  )
}
