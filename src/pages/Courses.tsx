import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { data } from '../content'
import { byId, courseStats, semesterLabel, upcomingAssignments } from '../lib/selectors'
import { pluralize, relativeTime } from '../lib/format'
import { CourseTable } from '../components/courses/CourseRow'
import { CategoryBadge, StatusPill } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { Icon } from '../components/ui/Icon'
import { dueTone } from '../components/assignments/AssignmentRow'

type Sort = 'activity' | 'code' | 'title' | 'materials'

const SORTS: { id: Sort; label: string }[] = [
  { id: 'activity', label: 'Latest' },
  { id: 'code', label: 'Code' },
  { id: 'title', label: 'Title' },
  { id: 'materials', label: 'Most material' },
]

export function Courses() {
  const [params, setParams] = useSearchParams()
  const semesterId = params.get('semester') ?? ''
  const categoryId = params.get('category') ?? ''
  const sort = (params.get('sort') as Sort) ?? 'activity'

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const courses = useMemo(() => {
    const filtered = data.courses.filter((course) => {
      if (course.status === 'archived') return false
      if (semesterId && course.semesterId !== semesterId) return false
      if (categoryId && course.categoryId !== categoryId) return false
      return true
    })
    const sorted = [...filtered]
    switch (sort) {
      case 'code':
        sorted.sort((a, b) => a.code.localeCompare(b.code))
        break
      case 'title':
        sorted.sort((a, b) => a.title.localeCompare(b.title))
        break
      case 'materials':
        sorted.sort((a, b) => courseStats(data, b.id).materials - courseStats(data, a.id).materials)
        break
      default:
        sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    }
    return sorted
  }, [semesterId, categoryId, sort])

  const semester = byId(data.semesters, semesterId)
  const category = byId(data.categories, categoryId)
  const deadlines = upcomingAssignments(data, 5)
  const recent = [...data.materials].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)

  return (
    <div className="d-container">
      <div className="page-title">
        <div>
          <h1>
            {category ? category.name : semester ? semesterLabel(semester) : 'Courses'}
          </h1>
          <p>
            {category?.description ??
              'Every course with its materials, coursework, and teaching staff. Pick a course to see its syllabus and files.'}
          </p>
        </div>
      </div>

      <div className="d-row d-row--between">
        <ul className="nav-pills">
          <li>
            <Link to="/" className={!semesterId && !categoryId ? 'is-active' : undefined}>
              All
              <span className="nav-pills__count">
                {data.courses.filter((c) => c.status !== 'archived').length}
              </span>
            </Link>
          </li>
          {data.semesters.slice(0, 3).map((item) => (
            <li key={item.id}>
              <Link
                to={`/?semester=${item.id}`}
                className={semesterId === item.id ? 'is-active' : undefined}
              >
                {semesterLabel(item)}
              </Link>
            </li>
          ))}
          <li>
            <Link to="/archive">Archive</Link>
          </li>
        </ul>

        <label className="sort-control">
          <span className="visually-hidden">Sort courses by</span>
          <select
            className="d-input"
            value={sort}
            onChange={(event) => setParam('sort', event.target.value)}
          >
            {SORTS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="d-split">
        <div className="d-stack">
          {courses.length === 0 ? (
            <EmptyState
              icon="courses"
              title="No courses here"
              description="Nothing matches this filter yet."
              action={
                <Link className="btn" to="/">
                  Show all courses
                </Link>
              }
            />
          ) : (
            <CourseTable courses={courses} showSemester={!semesterId} />
          )}
          <p className="muted">{pluralize(courses.length, 'course')}</p>
        </div>

        <aside className="d-stack">
          <section className="panel">
            <div className="panel__header">
              <h2>Due next</h2>
              <Link className="btn btn--flat btn--small" to="/assignments">
                All
              </Link>
            </div>
            {deadlines.length === 0 ? (
              <div className="panel__body">
                <p className="muted">Nothing is due right now.</p>
              </div>
            ) : (
              <ul className="panel__list">
                {deadlines.map((assignment) => {
                  const course = byId(data.courses, assignment.courseId)
                  return (
                    <li key={assignment.id}>
                      <Link
                        className="mini-item"
                        to={`/courses/${assignment.courseId}?tab=coursework&focus=${assignment.id}`}
                      >
                        <span className="mini-item__body">
                          <strong>{assignment.title}</strong>
                          <span>{course?.code}</span>
                        </span>
                        <StatusPill tone={dueTone(assignment)}>
                          {relativeTime(assignment.dueDate)}
                        </StatusPill>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section className="panel">
            <div className="panel__header">
              <h2>Latest material</h2>
              <Link className="btn btn--flat btn--small" to="/materials">
                All
              </Link>
            </div>
            <ul className="panel__list">
              {recent.map((material) => {
                const course = byId(data.courses, material.courseId)
                return (
                  <li key={material.id}>
                    <Link
                      className="mini-item"
                      to={`/courses/${material.courseId}?tab=materials&focus=${material.id}`}
                    >
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

          <section className="panel">
            <div className="panel__header">
              <h2>Categories</h2>
              <Link className="btn btn--flat btn--small" to="/categories">
                All
              </Link>
            </div>
            <ul className="panel__list">
              {data.categories.map((item) => {
                const count = data.courses.filter(
                  (c) => c.categoryId === item.id && c.status !== 'archived',
                ).length
                return (
                  <li key={item.id}>
                    <Link className="mini-item" to={`/categories/${item.id}`}>
                      <span className="mini-item__body">
                        <CategoryBadge category={item} link={false} />
                      </span>
                      <span className="muted">{count}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>

          <p className="sidebar-note">
            <Icon name="alert" size={13} />
            This site is generated from a file in the repository. See{' '}
            <Link to="/about">About</Link> for how it is kept up to date.
          </p>
        </aside>
      </div>
    </div>
  )
}
