import { Link } from 'react-router-dom'
import type { Course } from '../../types'
import { useData } from '../../store/DataProvider'
import { byId, courseStats, semesterLabel, tagsFor, peopleFor } from '../../lib/selectors'
import { pluralize } from '../../lib/format'
import { AvatarStack } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { Icon } from '../ui/Icon'
import { TagList } from '../ui/TagPicker'

const STATUS_TONE = {
  published: 'success',
  draft: 'warning',
  archived: 'neutral',
} as const

export function CourseCard({ course }: { course: Course }) {
  const { data } = useData()
  const stats = courseStats(data, course.id)
  const category = byId(data.categories, course.categoryId)
  const semester = byId(data.semesters, course.semesterId)
  const staff = peopleFor(data.people, [...course.professorIds, ...course.taIds])
  const fill = course.capacity ? Math.round((course.enrolled / course.capacity) * 100) : 0

  return (
    <Link to={`/courses/${course.id}`} className="course-card card card--interactive">
      <span className="course-card__stripe" style={{ background: course.color }} />
      <div className="course-card__body">
        <div className="row row--between" style={{ alignItems: 'flex-start' }}>
          <span className="course-card__code">{course.code}</span>
          <Badge tone={STATUS_TONE[course.status]} dot>
            {course.status}
          </Badge>
        </div>

        <h3 className="course-card__title">{course.title}</h3>
        <p className="course-card__summary">{course.summary}</p>

        <div className="course-card__meta">
          {category && (
            <span className="course-card__meta-item">
              <span className="tag-pill__swatch" style={{ background: category.color }} />
              {category.name}
            </span>
          )}
          <span className="course-card__meta-item">
            <Icon name="semesters" size={13} />
            {semesterLabel(semester)}
          </span>
          <span className="course-card__meta-item">
            <Icon name="award" size={13} />
            {pluralize(course.credits, 'credit')}
          </span>
        </div>

        <TagList tags={tagsFor(data.tags, course.tagIds)} max={3} />

        <div className="course-card__footer">
          <AvatarStack people={staff} />
          <span className="course-card__counts">
            <span title="Materials">
              <Icon name="materials" size={13} /> {stats.materials}
            </span>
            <span title="Assignments">
              <Icon name="assignments" size={13} /> {stats.assignments}
            </span>
            <span title="Enrolled students">
              <Icon name="users" size={13} /> {course.enrolled}
            </span>
          </span>
        </div>

        <div className="course-card__meter" title={`${course.enrolled} of ${course.capacity} seats filled`}>
          <div className="meter">
            <div
              className="meter__fill"
              style={{ width: `${Math.min(fill, 100)}%`, background: course.color }}
            />
          </div>
          <span>{fill}% full</span>
        </div>
      </div>
    </Link>
  )
}

export function CourseRow({ course }: { course: Course }) {
  const { data } = useData()
  const stats = courseStats(data, course.id)
  const semester = byId(data.semesters, course.semesterId)
  const staff = peopleFor(data.people, [...course.professorIds, ...course.taIds])
  return (
    <tr>
      <td>
        <Link to={`/courses/${course.id}`} className="link-strong">
          <span className="course-row__code" style={{ borderColor: course.color, color: course.color }}>
            {course.code}
          </span>
          {course.title}
        </Link>
      </td>
      <td>{semesterLabel(semester)}</td>
      <td>
        <AvatarStack people={staff} max={3} />
      </td>
      <td className="numeric">{stats.materials}</td>
      <td className="numeric">{stats.assignments}</td>
      <td className="numeric">
        {course.enrolled}/{course.capacity}
      </td>
      <td>
        <Badge tone={STATUS_TONE[course.status]} dot>
          {course.status}
        </Badge>
      </td>
    </tr>
  )
}
