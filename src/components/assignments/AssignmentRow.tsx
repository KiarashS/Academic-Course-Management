import { Link } from 'react-router-dom'
import type { Assignment } from '../../types'
import { useData } from '../../store/DataProvider'
import { byId, tagsFor } from '../../lib/selectors'
import { daysUntil, formatDate, relativeTime } from '../../lib/format'
import { Badge } from '../ui/Badge'
import { Icon } from '../ui/Icon'
import { Menu } from '../ui/Menu'
import { TagList } from '../ui/TagPicker'
import { assignmentIcon } from './AssignmentForm'

export function dueTone(assignment: Assignment) {
  const days = daysUntil(assignment.dueDate)
  if (days < 0) return 'neutral' as const
  if (days <= 2) return 'danger' as const
  if (days <= 7) return 'warning' as const
  return 'success' as const
}

export function AssignmentRow({
  assignment,
  showCourse = false,
  canManage,
  highlighted = false,
  onEdit,
  onDelete,
  onTogglePublished,
}: {
  assignment: Assignment
  showCourse?: boolean
  canManage: boolean
  highlighted?: boolean
  onEdit?: () => void
  onDelete?: () => void
  onTogglePublished?: () => void
}) {
  const { data } = useData()
  const course = byId(data.courses, assignment.courseId)
  const overdue = daysUntil(assignment.dueDate) < 0
  const gradedPct = assignment.submissions
    ? Math.round((assignment.graded / assignment.submissions) * 100)
    : 0

  return (
    <article
      className={`assignment-row${highlighted ? ' is-highlighted' : ''}`}
      id={`assignment-${assignment.id}`}
    >
      <span className="assignment-row__icon" data-type={assignment.type}>
        <Icon name={assignmentIcon(assignment.type)} size={18} />
      </span>

      <div className="assignment-row__main">
        <div className="row" style={{ gap: 'var(--space-2)' }}>
          <h4>{assignment.title}</h4>
          {!assignment.published && <Badge tone="warning">Draft</Badge>}
          {assignment.allowLate && <Badge>Late allowed</Badge>}
        </div>
        <p className="assignment-row__desc">{assignment.description}</p>
        <div className="assignment-row__meta">
          <span className="assignment-row__type">{assignment.type}</span>
          {showCourse && course && (
            <Link to={`/courses/${course.id}`} className="link-muted">
              {course.code}
            </Link>
          )}
          <span>{assignment.points} pts</span>
          <span>{assignment.weight}% of grade</span>
          {assignment.attachmentUrl && (
            <a
              className="link-muted"
              href={assignment.attachmentUrl}
              target="_blank"
              rel="noreferrer noopener"
            >
              <Icon name="external" size={12} /> Brief
            </a>
          )}
        </div>
        <TagList tags={tagsFor(data.tags, assignment.tagIds)} max={3} />
      </div>

      <div className="assignment-row__right">
        <Badge tone={dueTone(assignment)} dot>
          {overdue ? 'Closed' : relativeTime(assignment.dueDate)}
        </Badge>
        <span className="assignment-row__due">{formatDate(assignment.dueDate, true)}</span>
        <span className="assignment-row__progress" title={`${assignment.graded} of ${assignment.submissions} graded`}>
          <Icon name="upload" size={12} /> {assignment.submissions} submitted · {gradedPct}% graded
        </span>
      </div>

      {canManage && (
        <Menu label={`Actions for ${assignment.title}`}>
          {(close) => (
            <>
              <button
                onClick={() => {
                  onEdit?.()
                  close()
                }}
              >
                <Icon name="edit" size={15} /> Edit
              </button>
              <button
                onClick={() => {
                  onTogglePublished?.()
                  close()
                }}
              >
                <Icon name={assignment.published ? 'eyeOff' : 'eye'} size={15} />
                {assignment.published ? 'Unpublish' : 'Publish'}
              </button>
              <div className="menu__divider" />
              <button
                className="is-danger"
                onClick={() => {
                  onDelete?.()
                  close()
                }}
              >
                <Icon name="trash" size={15} /> Delete
              </button>
            </>
          )}
        </Menu>
      )}
    </article>
  )
}
