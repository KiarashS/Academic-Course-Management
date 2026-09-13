import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { MaterialType } from '../types'
import { data } from '../content'
import { formatBytes, pluralize } from '../lib/format'
import { MATERIAL_TYPES } from '../lib/contentTypes'
import { MaterialRow } from '../components/materials/MaterialRow'
import { EmptyState } from '../components/ui/EmptyState'
import { Icon } from '../components/ui/Icon'

export function Materials() {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const type = (params.get('type') as MaterialType | null) ?? ''
  const courseId = params.get('course') ?? ''
  const tagId = params.get('tag') ?? ''
  const sort = params.get('sort') ?? 'recent'

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const materials = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const filtered = data.materials.filter((material) => {
      if (type && material.type !== type) return false
      if (courseId && material.courseId !== courseId) return false
      if (tagId && !material.tagIds.includes(tagId)) return false
      if (!needle) return true
      return `${material.title} ${material.description ?? ''}`.toLowerCase().includes(needle)
    })
    const sorted = [...filtered]
    if (sort === 'title') sorted.sort((a, b) => a.title.localeCompare(b.title))
    else if (sort === 'size') sorted.sort((a, b) => b.sizeBytes - a.sizeBytes)
    else if (sort === 'downloads') sorted.sort((a, b) => b.downloads - a.downloads)
    else sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return sorted
  }, [query, type, courseId, tagId, sort])

  const counts = MATERIAL_TYPES.map((item) => ({
    ...item,
    count: data.materials.filter((m) => m.type === item.value).length,
  })).filter((item) => item.count > 0)

  const totalSize = materials.reduce((sum, m) => sum + m.sizeBytes, 0)

  return (
    <div className="d-container">
      <div className="page-title">
        <div>
          <h1>Materials</h1>
          <p>
            Every slide deck, reading, recording, dataset, and link across all courses, in one
            searchable list.
          </p>
        </div>
      </div>

      <ul className="nav-pills">
        <li>
          <Link to="/materials" className={!type ? 'is-active' : undefined}>
            All
            <span className="nav-pills__count">{data.materials.length}</span>
          </Link>
        </li>
        {counts.map((item) => (
          <li key={item.value}>
            <Link
              to={`/materials?type=${item.value}`}
              className={type === item.value ? 'is-active' : undefined}
            >
              <Icon name={item.icon} size={14} />
              {item.plural}
              <span className="nav-pills__count">{item.count}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="filter-bar">
        <div className="search-field">
          <Icon name="search" size={16} />
          <input
            value={query}
            placeholder="Search titles and descriptions…"
            onChange={(event) => setParam('q', event.target.value)}
          />
        </div>
        <select
          className="d-input"
          value={courseId}
          aria-label="Course"
          onChange={(event) => setParam('course', event.target.value)}
        >
          <option value="">All courses</option>
          {data.courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.code} — {course.title}
            </option>
          ))}
        </select>
        <select
          className="d-input"
          value={tagId}
          aria-label="Tag"
          onChange={(event) => setParam('tag', event.target.value)}
        >
          <option value="">All tags</option>
          {data.tags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>
        <select
          className="d-input"
          value={sort}
          aria-label="Sort by"
          onChange={(event) => setParam('sort', event.target.value)}
        >
          <option value="recent">Newest</option>
          <option value="title">Title</option>
          <option value="size">Largest</option>
          <option value="downloads">Most downloaded</option>
        </select>
      </div>

      <p className="muted">
        {pluralize(materials.length, 'item')}
        {totalSize > 0 && ` · ${formatBytes(totalSize)}`}
      </p>

      {materials.length === 0 ? (
        <EmptyState
          icon="materials"
          title="Nothing matches"
          description="Try a different type, course, or search term."
          action={
            <Link className="btn" to="/materials">
              Clear filters
            </Link>
          }
        />
      ) : (
        <section className="panel">
          <ul className="material-list">
            {materials.map((material) => (
              <MaterialRow key={material.id} material={material} showCourse />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
