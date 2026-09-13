import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Category, Tag } from '../types'
import { useData } from '../store/DataProvider'
import { useSession } from '../store/session'
import { useToast } from '../store/ToastProvider'
import { tagUsage } from '../lib/selectors'
import { pluralize } from '../lib/format'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { Menu } from '../components/ui/Menu'
import { ConfirmDialog, Modal } from '../components/ui/Modal'
import { TextAreaField, TextField } from '../components/ui/Field'

const COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#f43f5e', '#14b8a6', '#a855f7', '#64748b']

export function Taxonomy() {
  const store = useData()
  const { data } = store
  const { canManageTaxonomy } = useSession()
  const { notify } = useToast()
  const [tagForm, setTagForm] = useState<{ open: boolean; tag?: Tag }>({ open: false })
  const [categoryForm, setCategoryForm] = useState<{ open: boolean; category?: Category }>({ open: false })
  const [confirm, setConfirm] = useState<{ title: string; message: string; run: () => void } | null>(null)

  const tags = [...data.tags].sort((a, b) => {
    const ua = tagUsage(data, a.id)
    const ub = tagUsage(data, b.id)
    return ub.courses + ub.materials + ub.assignments - (ua.courses + ua.materials + ua.assignments)
  })

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="page-header__eyebrow">Organisation</p>
          <h1>Tags &amp; categories</h1>
          <p>
            Categories place a course in a subject area; tags cut across courses, materials, and
            assignments for search and filtering.
          </p>
        </div>
      </header>

      <section className="grid grid--split">
        <div className="card">
          <div className="card__header">
            <div>
              <h3>Tags</h3>
              <p>{pluralize(tags.length, 'tag')}, ordered by how often they are used.</p>
            </div>
            {canManageTaxonomy && (
              <Button size="sm" icon="plus" onClick={() => setTagForm({ open: true })}>
                New tag
              </Button>
            )}
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Tag</th>
                  <th className="numeric">Courses</th>
                  <th className="numeric">Materials</th>
                  <th className="numeric">Assignments</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {tags.map((tag) => {
                  const usage = tagUsage(data, tag.id)
                  const total = usage.courses + usage.materials + usage.assignments
                  return (
                    <tr key={tag.id}>
                      <td>
                        <Link to={`/courses?tags=${tag.id}`} className="tag-pill">
                          <span className="tag-pill__swatch" style={{ background: tag.color }} />
                          {tag.name}
                        </Link>
                      </td>
                      <td className="numeric">{usage.courses}</td>
                      <td className="numeric">{usage.materials}</td>
                      <td className="numeric">{usage.assignments}</td>
                      <td>
                        {canManageTaxonomy && (
                          <div className="table__actions">
                            <Menu label={`Actions for ${tag.name}`}>
                              {(close) => (
                                <>
                                  <button
                                    onClick={() => {
                                      setTagForm({ open: true, tag })
                                      close()
                                    }}
                                  >
                                    <Icon name="edit" size={15} /> Rename
                                  </button>
                                  <button
                                    className="is-danger"
                                    onClick={() => {
                                      close()
                                      setConfirm({
                                        title: `Delete the “${tag.name}” tag?`,
                                        message:
                                          total > 0
                                            ? `It is removed from ${total} record${total === 1 ? '' : 's'}. Nothing else is deleted.`
                                            : 'This tag is unused.',
                                        run: () => {
                                          store.deleteTag(tag.id)
                                          notify('Tag deleted.', 'error')
                                        },
                                      })
                                    }}
                                  >
                                    <Icon name="trash" size={15} /> Delete
                                  </button>
                                </>
                              )}
                            </Menu>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card__header">
            <div>
              <h3>Categories</h3>
              <p>One per course.</p>
            </div>
            {canManageTaxonomy && (
              <Button size="sm" icon="plus" onClick={() => setCategoryForm({ open: true })}>
                New
              </Button>
            )}
          </div>
          <ul className="category-list">
            {data.categories.map((category) => {
              const count = data.courses.filter((c) => c.categoryId === category.id).length
              return (
                <li key={category.id}>
                  <span className="category-list__swatch" style={{ background: category.color }} />
                  <span className="category-list__body">
                    <Link to={`/courses?category=${category.id}`} className="link-strong">
                      {category.name}
                    </Link>
                    {category.description && <span>{category.description}</span>}
                  </span>
                  <span className="muted-text">{pluralize(count, 'course')}</span>
                  {canManageTaxonomy && (
                    <Menu label={`Actions for ${category.name}`}>
                      {(close) => (
                        <>
                          <button
                            onClick={() => {
                              setCategoryForm({ open: true, category })
                              close()
                            }}
                          >
                            <Icon name="edit" size={15} /> Edit
                          </button>
                          <button
                            className="is-danger"
                            disabled={count > 0}
                            onClick={() => {
                              close()
                              setConfirm({
                                title: `Delete “${category.name}”?`,
                                message: 'Only empty categories can be removed.',
                                run: () => {
                                  store.deleteCategory(category.id)
                                  notify('Category deleted.', 'error')
                                },
                              })
                            }}
                          >
                            <Icon name="trash" size={15} /> Delete
                          </button>
                        </>
                      )}
                    </Menu>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      {tagForm.open && (
        <TaxonomyModal
          title={tagForm.tag ? `Edit “${tagForm.tag.name}”` : 'New tag'}
          initial={{ name: tagForm.tag?.name ?? '', color: tagForm.tag?.color ?? COLORS[0], description: '' }}
          withDescription={false}
          onClose={() => setTagForm({ open: false })}
          onSubmit={({ name, color }) => {
            const slug = name.trim().toLowerCase().replace(/\s+/g, '-')
            if (tagForm.tag) {
              store.updateTag(tagForm.tag.id, { name: slug, color })
              notify('Tag updated.')
            } else {
              store.addTag(slug, color)
              notify('Tag created.')
            }
            setTagForm({ open: false })
          }}
        />
      )}

      {categoryForm.open && (
        <TaxonomyModal
          title={categoryForm.category ? `Edit “${categoryForm.category.name}”` : 'New category'}
          initial={{
            name: categoryForm.category?.name ?? '',
            color: categoryForm.category?.color ?? COLORS[0],
            description: categoryForm.category?.description ?? '',
          }}
          withDescription
          onClose={() => setCategoryForm({ open: false })}
          onSubmit={(values) => {
            if (categoryForm.category) {
              store.updateCategory(categoryForm.category.id, values)
              notify('Category updated.')
            } else {
              store.addCategory(values)
              notify('Category created.')
            }
            setCategoryForm({ open: false })
          }}
        />
      )}

      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.title ?? ''}
        message={confirm?.message ?? ''}
        onConfirm={() => confirm?.run()}
        onClose={() => setConfirm(null)}
      />
    </div>
  )
}

function TaxonomyModal({
  title,
  initial,
  withDescription,
  onClose,
  onSubmit,
}: {
  title: string
  initial: { name: string; color: string; description: string }
  withDescription: boolean
  onClose: () => void
  onSubmit: (values: { name: string; color: string; description: string }) => void
}) {
  const [values, setValues] = useState(initial)

  return (
    <Modal
      open
      size="narrow"
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!values.name.trim()} onClick={() => onSubmit(values)}>
            Save
          </Button>
        </>
      }
    >
      <TextField
        label="Name"
        value={values.name}
        onChange={(event) => setValues({ ...values, name: event.target.value })}
      />
      {withDescription && (
        <TextAreaField
          label="Description"
          style={{ minHeight: 64 }}
          value={values.description}
          onChange={(event) => setValues({ ...values, description: event.target.value })}
        />
      )}
      <div className="field">
        <span className="field__label">Colour</span>
        <div className="chip-row">
          {COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`swatch${values.color === color ? ' is-selected' : ''}`}
              style={{ background: color }}
              aria-label={`Use ${color}`}
              aria-pressed={values.color === color}
              onClick={() => setValues({ ...values, color })}
            />
          ))}
        </div>
      </div>
    </Modal>
  )
}
