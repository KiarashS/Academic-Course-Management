import { Link, useParams } from 'react-router-dom'
import { data } from '../content'
import { byId, tagUsage } from '../lib/selectors'
import { pluralize } from '../lib/format'
import { CourseTable } from '../components/courses/CourseRow'
import { MaterialRow } from '../components/materials/MaterialRow'
import { EmptyState } from '../components/ui/EmptyState'
import { Icon } from '../components/ui/Icon'

export function Tags() {
  const tags = [...data.tags]
    .map((tag) => ({ tag, usage: tagUsage(data, tag.id) }))
    .map((item) => ({
      ...item,
      total: item.usage.courses + item.usage.materials + item.usage.assignments,
    }))
    .sort((a, b) => b.total - a.total || a.tag.name.localeCompare(b.tag.name))

  return (
    <div className="d-container">
      <div className="page-title">
        <div>
          <h1>Tags</h1>
          <p>Tags cut across courses, materials, and coursework. Pick one to see everything under it.</p>
        </div>
      </div>

      <div className="tag-cloud">
        {tags.map(({ tag, total, usage }) => (
          <Link key={tag.id} to={`/tags/${tag.id}`} className="tag-cloud__item">
            <span className="tag-cloud__name">{tag.name}</span>
            <span className="tag-cloud__count">{total}</span>
            <span className="tag-cloud__detail">
              {usage.courses} courses · {usage.materials} materials
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function TagDetail() {
  const { tagId = '' } = useParams()
  const tag = byId(data.tags, tagId)
  const courses = data.courses.filter((c) => c.tagIds.includes(tagId) && c.status !== 'archived')
  const materials = data.materials.filter((m) => m.tagIds.includes(tagId))

  if (!tag) {
    return (
      <EmptyState
        icon="tags"
        title="Tag not found"
        action={
          <Link className="btn btn--primary" to="/tags">
            All tags
          </Link>
        }
      />
    )
  }

  return (
    <div className="d-container">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/tags">Tags</Link>
        <Icon name="chevronRight" size={12} />
        <span className="discourse-tag">{tag.name}</span>
      </nav>

      <div className="page-title">
        <div>
          <h1>{tag.name}</h1>
          <p>
            {pluralize(courses.length, 'course')} and {pluralize(materials.length, 'material')}{' '}
            carry this tag.
          </p>
        </div>
      </div>

      {courses.length > 0 && <CourseTable courses={courses} />}

      {materials.length > 0 && (
        <section className="panel">
          <div className="panel__header">
            <h2>Materials</h2>
            <span className="muted">{pluralize(materials.length, 'item')}</span>
          </div>
          <ul className="material-list">
            {materials.map((material) => (
              <MaterialRow key={material.id} material={material} showCourse />
            ))}
          </ul>
        </section>
      )}

      {courses.length === 0 && materials.length === 0 && (
        <EmptyState icon="tags" title="Nothing carries this tag" />
      )}
    </div>
  )
}
