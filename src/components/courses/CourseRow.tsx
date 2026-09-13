import { Link } from 'react-router-dom'
import type { Course } from '../../types'
import { data } from '../../content'
import { byId, courseStats, peopleFor, semesterLabel, tagsFor } from '../../lib/selectors'
import { relativeTime } from '../../lib/format'
import { AvatarGroup } from '../ui/Avatar'
import { CategoryBadge, StatusPill, TagRow } from '../ui/Badge'

/** One row of the course table, shaped like a Discourse topic-list item. */
export function CourseRow({ course, showSemester = true }: { course: Course; showSemester?: boolean }) {
  const stats = courseStats(data, course.id)
  const staff = peopleFor(data.people, [...course.professorIds, ...course.taIds])

  return (
    <tr>
      <td>
        <Link to={`/courses/${course.id}`} className="topic-list__title">
          {course.title}
        </Link>
        <div className="topic-list__meta">
          <span className="topic-list__code">{course.code}</span>
          <CategoryBadge category={byId(data.categories, course.categoryId)} />
          <TagRow tags={tagsFor(data.tags, course.tagIds)} max={3} />
          {course.status === 'archived' && <StatusPill tone="closed">Archived</StatusPill>}
        </div>
        {course.summary && <p className="topic-list__excerpt">{course.summary}</p>}
      </td>
      <td className="posters">
        <AvatarGroup people={staff} max={4} />
      </td>
      <td className="num">
        <span className="topic-list__num">
          <strong>{stats.materials}</strong>
          materials
        </span>
      </td>
      <td className="num">
        <span className="topic-list__num">
          <strong>{stats.assignments}</strong>
          tasks
        </span>
      </td>
      <td className="num">
        <span className="topic-list__activity">
          {showSemester
            ? semesterLabel(byId(data.semesters, course.semesterId))
            : relativeTime(course.updatedAt)}
        </span>
      </td>
    </tr>
  )
}

export function CourseTable({
  courses,
  showSemester = true,
}: {
  courses: Course[]
  showSemester?: boolean
}) {
  return (
    <div className="topic-list-wrap">
      <table className="topic-list">
        <thead>
          <tr>
            <th>Course</th>
            <th className="posters">Staff</th>
            <th className="num">Materials</th>
            <th className="num">Tasks</th>
            <th className="num">{showSemester ? 'Semester' : 'Updated'}</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((course) => (
            <CourseRow key={course.id} course={course} showSemester={showSemester} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
