import { Link } from 'react-router-dom'
import type { Material } from '../../types'
import { data } from '../../content'
import { byId, tagsFor } from '../../lib/selectors'
import { formatBytes, formatDate } from '../../lib/format'
import { materialIcon, materialLabel, opensInPlace } from '../../lib/contentTypes'
import { Icon } from '../ui/Icon'
import { TagRow } from '../ui/Badge'

export function MaterialRow({
  material,
  showCourse = false,
}: {
  material: Material
  showCourse?: boolean
}) {
  const course = byId(data.courses, material.courseId)
  const author = byId(data.people, material.authorId)
  const external = opensInPlace(material.type)

  return (
    <li className="material-row">
      <span className="material-row__icon" data-type={material.type}>
        <Icon name={materialIcon(material.type)} size={17} />
      </span>

      <div className="material-row__body">
        <a
          className="material-row__title"
          href={material.url}
          target="_blank"
          rel="noreferrer noopener"
        >
          {material.title}
        </a>
        {material.description && <p className="material-row__desc">{material.description}</p>}
        <div className="material-row__meta">
          <span>{materialLabel(material.type)}</span>
          {showCourse && course && (
            <Link to={`/courses/${course.id}`}>{course.code}</Link>
          )}
          {material.week ? <span>Week {material.week}</span> : null}
          {material.sizeBytes > 0 && <span>{formatBytes(material.sizeBytes)}</span>}
          {author && <span>{author.name}</span>}
          <span>{formatDate(material.createdAt)}</span>
        </div>
        <TagRow tags={tagsFor(data.tags, material.tagIds)} max={4} />
      </div>

      <a
        className="btn btn--small material-row__action"
        href={material.url}
        target="_blank"
        rel="noreferrer noopener"
      >
        <Icon name={external ? 'external' : 'download'} size={14} />
        {external ? 'Open' : 'Download'}
      </a>
    </li>
  )
}
