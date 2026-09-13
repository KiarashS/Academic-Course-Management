import { Link } from 'react-router-dom'
import type { Material } from '../../types'
import { useData } from '../../store/DataProvider'
import { byId } from '../../lib/selectors'
import { formatBytes, formatDate } from '../../lib/format'
import { Icon } from '../ui/Icon'
import { Badge } from '../ui/Badge'
import { Menu } from '../ui/Menu'
import { TagList } from '../ui/TagPicker'
import { materialIcon, materialLabel } from './MaterialForm'
import { tagsFor } from '../../lib/selectors'

export function MaterialRow({
  material,
  showCourse = false,
  canManage,
  highlighted = false,
  onEdit,
  onDelete,
  onToggleVisibility,
}: {
  material: Material
  showCourse?: boolean
  canManage: boolean
  highlighted?: boolean
  onEdit?: () => void
  onDelete?: () => void
  onToggleVisibility?: () => void
}) {
  const { data, registerDownload } = useData()
  const course = byId(data.courses, material.courseId)
  const author = byId(data.people, material.authorId)

  return (
    <article className={`material-row${highlighted ? ' is-highlighted' : ''}`} id={`material-${material.id}`}>
      <span className="material-row__icon" data-type={material.type}>
        <Icon name={materialIcon(material.type)} size={18} />
      </span>

      <div className="material-row__main">
        <div className="row" style={{ gap: 'var(--space-2)' }}>
          <h4>{material.title}</h4>
          {!material.visible && (
            <Badge tone="warning">
              <Icon name="eyeOff" size={11} /> Hidden
            </Badge>
          )}
          {material.week && <Badge>Week {material.week}</Badge>}
        </div>
        {material.description && <p className="material-row__desc">{material.description}</p>}
        <div className="material-row__meta">
          <span>{materialLabel(material.type)}</span>
          {showCourse && course && (
            <Link to={`/courses/${course.id}`} className="link-muted">
              {course.code}
            </Link>
          )}
          {material.sizeBytes > 0 && <span>{formatBytes(material.sizeBytes)}</span>}
          <span>{author?.name ?? 'Unknown'}</span>
          <span>{formatDate(material.createdAt)}</span>
          <span>
            <Icon name="download" size={12} /> {material.downloads}
          </span>
        </div>
        <TagList tags={tagsFor(data.tags, material.tagIds)} max={4} />
      </div>

      <div className="material-row__actions">
        <a
          className="btn btn--secondary btn--sm"
          href={material.url}
          target="_blank"
          rel="noreferrer noopener"
          onClick={() => registerDownload(material.id)}
        >
          <Icon name={material.type === 'link' || material.type === 'video' ? 'external' : 'download'} size={14} />
          {material.type === 'link' || material.type === 'video' ? 'Open' : 'Download'}
        </a>
        {canManage && (
          <Menu label={`Actions for ${material.title}`}>
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
                    onToggleVisibility?.()
                    close()
                  }}
                >
                  <Icon name={material.visible ? 'eyeOff' : 'eye'} size={15} />
                  {material.visible ? 'Hide from students' : 'Make visible'}
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
      </div>
    </article>
  )
}
