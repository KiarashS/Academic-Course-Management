import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { data } from '../content'
import { byId, courseStats, semesterLabel } from '../lib/selectors'
import { formatDate, pluralize } from '../lib/format'
import { AvatarGroup } from '../components/ui/Avatar'
import { CategoryBadge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { peopleFor } from '../lib/selectors'

export function Archive() {
  const [params] = useSearchParams()
  const semesterId = params.get('semester') ?? ''

  const archived = useMemo(
    () =>
      data.courses
        .filter((c) => c.status === 'archived')
        .filter((c) => (semesterId ? c.semesterId === semesterId : true))
        .sort((a, b) => (b.archivedAt ?? b.updatedAt).localeCompare(a.archivedAt ?? a.updatedAt)),
    [semesterId],
  )

  const semesters = data.semesters.filter((semester) =>
    data.courses.some((c) => c.status === 'archived' && c.semesterId === semester.id),
  )

  const materials = archived.reduce((sum, c) => sum + courseStats(data, c.id).materials, 0)

  return (
    <div className="d-container">
      <div className="page-title">
        <div>
          <h1>Archive</h1>
          <p>
            Courses that have finished. Their materials stay online and searchable —
            {' '}{pluralize(materials, 'file')} across {pluralize(archived.length, 'course')}.
          </p>
        </div>
      </div>

      <ul className="nav-pills">
        <li>
          <Link to="/archive" className={!semesterId ? 'is-active' : undefined}>
            All
          </Link>
        </li>
        {semesters.map((semester) => (
          <li key={semester.id}>
            <Link
              to={`/archive?semester=${semester.id}`}
              className={semesterId === semester.id ? 'is-active' : undefined}
            >
              {semesterLabel(semester)}
            </Link>
          </li>
        ))}
      </ul>

      {archived.length === 0 ? (
        <EmptyState
          icon="archive"
          title="The archive is empty"
          description="Courses marked archived in the content file appear here."
          action={
            <Link className="btn" to="/">
              Back to courses
            </Link>
          }
        />
      ) : (
        <div className="topic-list-wrap">
          <table className="topic-list">
            <thead>
              <tr>
                <th>Course</th>
                <th className="posters">Staff</th>
                <th className="num">Materials</th>
                <th className="num">Enrolled</th>
                <th className="num">Finished</th>
              </tr>
            </thead>
            <tbody>
              {archived.map((course) => {
                const stats = courseStats(data, course.id)
                const staff = peopleFor(data.people, [...course.professorIds, ...course.taIds])
                return (
                  <tr key={course.id}>
                    <td>
                      <Link to={`/courses/${course.id}`} className="topic-list__title">
                        {course.title}
                      </Link>
                      <div className="topic-list__meta">
                        <span className="topic-list__code">{course.code}</span>
                        <CategoryBadge category={byId(data.categories, course.categoryId)} />
                        <span className="muted">{semesterLabel(byId(data.semesters, course.semesterId))}</span>
                      </div>
                    </td>
                    <td className="posters">
                      <AvatarGroup people={staff} max={3} />
                    </td>
                    <td className="num">
                      <span className="topic-list__num">
                        <strong>{stats.materials}</strong>
                      </span>
                    </td>
                    <td className="num">
                      <span className="topic-list__num">
                        <strong>{course.enrolled}</strong>
                      </span>
                    </td>
                    <td className="num">
                      <span className="topic-list__activity">
                        {course.archivedAt ? formatDate(course.archivedAt) : '—'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
