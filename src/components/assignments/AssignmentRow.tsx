import { Link } from 'react-router-dom'
import type { Assignment } from '../../types'
import { data } from '../../content'
import { byId, tagsFor } from '../../lib/selectors'
import { daysUntil, formatDate, relativeTime } from '../../lib/format'
import { assignmentIcon, assignmentLabel } from '../../lib/contentTypes'
import { Icon } from '../ui/Icon'
import { StatusPill, TagRow } from '../ui/Badge'

export function dueTone(assignment: Assignment) {
  const days = daysUntil(assignment.dueDate)
  if (days < 0) return 'closed' as const
  if (days <= 2) return 'urgent' as const
  if (days <= 7) return 'soon' as const
  return 'open' as const
}

export function AssignmentRow({
  assignment,
  showCourse = false,
}: {
  assignment: Assignment
  showCourse?: boolean
}) {
  const course = byId(data.courses, assignment.courseId)
  const closed = daysUntil(assignment.dueDate) < 0

  return (
    <li className="assignment-row">
      <span className="assignment-row__icon" data-type={assignment.type}>
        <Icon name={assignmentIcon(assignment.type)} size={17} />
      </span>

      <div className="assignment-row__body">
        <div className="assignment-row__head">
          {course ? (
            <Link
              className="assignment-row__title"
              to={`/courses/${course.id}?tab=coursework&focus=${assignment.id}`}
            >
              {assignment.title}
            </Link>
          ) : (
            <span className="assignment-row__title">{assignment.title}</span>
          )}
          <StatusPill tone={dueTone(assignment)}>
            {closed ? 'Closed' : relativeTime(assignment.dueDate)}
          </StatusPill>
        </div>
        {assignment.description && (
          <p className="assignment-row__desc">{assignment.description}</p>
        )}
        <div className="assignment-row__meta">
          <span>{assignmentLabel(assignment.type)}</span>
          {showCourse && course && <Link to={`/courses/${course.id}`}>{course.code}</Link>}
          <span>Due {formatDate(assignment.dueDate, true)}</span>
          <span>{assignment.points} pts</span>
          {assignment.weight > 0 && <span>{assignment.weight}% of grade</span>}
          {assignment.attachmentUrl && (
            <a href={assignment.attachmentUrl} target="_blank" rel="noreferrer noopener">
              <Icon name="external" size={12} /> Brief
            </a>
          )}
        </div>
        <TagRow tags={tagsFor(data.tags, assignment.tagIds)} max={3} />
      </div>
    </li>
  )
}
