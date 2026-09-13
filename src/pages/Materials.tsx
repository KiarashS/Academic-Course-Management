import { useMemo, useState } from 'react'
import type { Material, MaterialType } from '../types'
import { useData } from '../store/DataProvider'
import { useSession } from '../store/session'
import { useToast } from '../store/ToastProvider'
import { formatBytes, pluralize } from '../lib/format'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { EmptyState } from '../components/ui/EmptyState'
import { ConfirmDialog } from '../components/ui/Modal'
import { MaterialRow } from '../components/materials/MaterialRow'
import { MaterialForm, MATERIAL_TYPES } from '../components/materials/MaterialForm'

type Sort = 'recent' | 'downloads' | 'title' | 'size'

export function Materials() {
  const store = useData()
  const { data } = store
  const { user, canManageContent } = useSession()
  const { notify } = useToast()

  const [query, setQuery] = useState('')
  const [type, setType] = useState<MaterialType | ''>('')
  const [courseId, setCourseId] = useState('')
  const [tagId, setTagId] = useState('')
  const [sort, setSort] = useState<Sort>('recent')
  const [onlyMine, setOnlyMine] = useState(false)
  const [form, setForm] = useState<{ open: boolean; material?: Material }>({ open: false })
  const [confirm, setConfirm] = useState<Material | null>(null)

  const materials = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const filtered = data.materials.filter((material) => {
      if (type && material.type !== type) return false
      if (courseId && material.courseId !== courseId) return false
      if (tagId && !material.tagIds.includes(tagId)) return false
      if (onlyMine && material.authorId !== user.id) return false
      if (!needle) return true
      return `${material.title} ${material.description ?? ''}`.toLowerCase().includes(needle)
    })
    const sorted = [...filtered]
    switch (sort) {
      case 'downloads':
        sorted.sort((a, b) => b.downloads - a.downloads)
        break
      case 'title':
        sorted.sort((a, b) => a.title.localeCompare(b.title))
        break
      case 'size':
        sorted.sort((a, b) => b.sizeBytes - a.sizeBytes)
        break
      default:
        sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    }
    return sorted
  }, [data.materials, query, type, courseId, tagId, sort, onlyMine, user.id])

  const totalSize = materials.reduce((sum, m) => sum + m.sizeBytes, 0)
  const byType = MATERIAL_TYPES.map((t) => ({
    ...t,
    count: data.materials.filter((m) => m.type === t.value).length,
  })).filter((t) => t.count > 0)

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="page-header__eyebrow">Library</p>
          <h1>Materials</h1>
          <p>
            Every slide deck, e-book, recording, dataset, and link across the department, searchable
            in one place.
          </p>
        </div>
        <div className="page-header__actions">
          <Button variant="primary" icon="plus" onClick={() => setForm({ open: true })}>
            Add material
          </Button>
        </div>
      </header>

      <section className="type-strip">
        <button className={`type-chip${type === '' ? ' is-selected' : ''}`} onClick={() => setType('')}>
          <Icon name="grid" size={15} />
          All
          <span>{data.materials.length}</span>
        </button>
        {byType.map((item) => (
          <button
            key={item.value}
            className={`type-chip${type === item.value ? ' is-selected' : ''}`}
            onClick={() => setType(type === item.value ? '' : item.value)}
          >
            <Icon name={item.icon} size={15} />
            {item.label}
            <span>{item.count}</span>
          </button>
        ))}
      </section>

      <section className="filter-bar card">
        <div className="filter-bar__search">
          <Icon name="search" size={16} />
          <input
            className="filter-bar__input"
            placeholder="Search titles and descriptions…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="filter-bar__controls">
          <select
            className="select"
            value={courseId}
            aria-label="Course"
            onChange={(event) => setCourseId(event.target.value)}
          >
            <option value="">All courses</option>
            {data.courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} — {course.title}
              </option>
            ))}
          </select>
          <select
            className="select"
            value={tagId}
            aria-label="Tag"
            onChange={(event) => setTagId(event.target.value)}
          >
            <option value="">All tags</option>
            {data.tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
          <select
            className="select"
            value={sort}
            aria-label="Sort by"
            onChange={(event) => setSort(event.target.value as Sort)}
          >
            <option value="recent">Newest first</option>
            <option value="downloads">Most downloaded</option>
            <option value="title">Title A–Z</option>
            <option value="size">Largest file</option>
          </select>
          <Button
            onClick={() => setOnlyMine((value) => !value)}
            aria-pressed={onlyMine}
            variant={onlyMine ? 'primary' : 'secondary'}
            icon="people"
          >
            Uploaded by me
          </Button>
        </div>
      </section>

      <div className="row row--between">
        <p className="muted-text">
          {pluralize(materials.length, 'item')}
          {totalSize > 0 && ` · ${formatBytes(totalSize)} total`}
        </p>
      </div>

      {materials.length === 0 ? (
        <EmptyState
          icon="materials"
          title="Nothing here"
          description="No material matches the current filters."
          action={
            <Button
              onClick={() => {
                setQuery('')
                setType('')
                setCourseId('')
                setTagId('')
                setOnlyMine(false)
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="stack--tight">
          {materials.map((material) => {
            const course = data.courses.find((c) => c.id === material.courseId)
            return (
              <MaterialRow
                key={material.id}
                material={material}
                showCourse
                canManage={course ? canManageContent(course) : false}
                onEdit={() => setForm({ open: true, material })}
                onToggleVisibility={() => {
                  store.updateMaterial(material.id, { visible: !material.visible })
                  notify(material.visible ? 'Hidden from students.' : 'Now visible to students.', 'info')
                }}
                onDelete={() => setConfirm(material)}
              />
            )
          })}
        </div>
      )}

      {form.open && (
        <MaterialForm
          open
          authorId={user.id}
          material={form.material}
          onClose={() => setForm({ open: false })}
          onSubmit={(values) => {
            if (form.material) {
              store.updateMaterial(form.material.id, values)
              notify('Material updated.')
            } else {
              store.addMaterial(values)
              notify('Material added.')
            }
            setForm({ open: false })
          }}
        />
      )}

      <ConfirmDialog
        open={confirm !== null}
        title={`Delete “${confirm?.title ?? ''}”?`}
        message="The entry is removed from the library. The linked file itself is untouched."
        onConfirm={() => {
          if (confirm) {
            store.deleteMaterial(confirm.id)
            notify('Material deleted.', 'error')
          }
        }}
        onClose={() => setConfirm(null)}
      />
    </div>
  )
}
