import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import type { Assignment, Material } from '../types'
import { useData } from '../store/DataProvider'
import { useSession } from '../store/session'
import { useToast } from '../store/ToastProvider'
import { byId, courseStats, semesterLabel, tagsFor } from '../lib/selectors'
import { dayName, formatDate, pluralize, relativeTime } from '../lib/format'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { Menu } from '../components/ui/Menu'
import { Modal, ConfirmDialog } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { TagList } from '../components/ui/TagPicker'
import { TextAreaField, TextField, CheckboxField, SelectField } from '../components/ui/Field'
import { CourseForm } from '../components/courses/CourseForm'
import { MaterialForm } from '../components/materials/MaterialForm'
import { MaterialRow } from '../components/materials/MaterialRow'
import { AssignmentForm } from '../components/assignments/AssignmentForm'
import { AssignmentRow } from '../components/assignments/AssignmentRow'

type Tab = 'overview' | 'materials' | 'assignments' | 'announcements' | 'staff'

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'materials', label: 'Materials' },
  { id: 'assignments', label: 'Assignments' },
  { id: 'announcements', label: 'Announcements' },
  { id: 'staff', label: 'Staff' },
]

export function CourseDetail() {
  const { courseId = '' } = useParams()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { notify } = useToast()
  const store = useData()
  const { data } = store
  const { user, canEditCourse, canManageContent } = useSession()

  const course = byId(data.courses, courseId)
  const tab = (params.get('tab') as Tab) ?? 'overview'
  const focusId = params.get('focus')

  const [editing, setEditing] = useState(false)
  const [materialForm, setMaterialForm] = useState<{ open: boolean; material?: Material }>({ open: false })
  const [assignmentForm, setAssignmentForm] = useState<{ open: boolean; assignment?: Assignment }>({ open: false })
  const [announcementOpen, setAnnouncementOpen] = useState(false)
  const [moduleOpen, setModuleOpen] = useState(false)
  const [confirm, setConfirm] = useState<{ title: string; message: string; run: () => void } | null>(null)
  const [materialQuery, setMaterialQuery] = useState('')
  const [materialType, setMaterialType] = useState('')

  useEffect(() => {
    if (!focusId) return
    const element = document.getElementById(`material-${focusId}`) ?? document.getElementById(`assignment-${focusId}`)
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [focusId, tab])

  const courseMaterials = useMemo(
    () =>
      data.materials
        .filter((m) => m.courseId === courseId)
        .sort((a, b) => (a.week ?? 99) - (b.week ?? 99) || b.createdAt.localeCompare(a.createdAt)),
    [data.materials, courseId],
  )

  const courseAssignments = useMemo(
    () =>
      data.assignments
        .filter((a) => a.courseId === courseId)
        .sort((a, b) => b.dueDate.localeCompare(a.dueDate)),
    [data.assignments, courseId],
  )

  const courseAnnouncements = useMemo(
    () =>
      data.announcements
        .filter((a) => a.courseId === courseId)
        .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt)),
    [data.announcements, courseId],
  )

  const modules = useMemo(
    () => data.modules.filter((m) => m.courseId === courseId).sort((a, b) => a.order - b.order),
    [data.modules, courseId],
  )

  if (!course) {
    return (
      <div className="page">
        <EmptyState
          icon="courses"
          title="Course not found"
          description="It may have been deleted from this workspace."
          action={<Link className="btn btn--primary" to="/courses">Back to courses</Link>}
        />
      </div>
    )
  }

  const stats = courseStats(data, course.id)
  const semester = byId(data.semesters, course.semesterId)
  const category = byId(data.categories, course.categoryId)
  const professors = course.professorIds.map((id) => byId(data.people, id)).filter(Boolean)
  const tas = course.taIds.map((id) => byId(data.people, id)).filter(Boolean)
  const mayEdit = canEditCourse(course)
  const mayManage = canManageContent(course)

  const visibleMaterials = courseMaterials.filter((material) => {
    if (materialType && material.type !== materialType) return false
    if (!materialQuery.trim()) return true
    const needle = materialQuery.toLowerCase()
    return `${material.title} ${material.description ?? ''}`.toLowerCase().includes(needle)
  })

  const setTab = (next: Tab) => {
    const search = new URLSearchParams(params)
    search.set('tab', next)
    search.delete('focus')
    setParams(search, { replace: true })
  }

  const groupedMaterials = [
    ...modules.map((module) => ({
      module,
      items: visibleMaterials.filter((m) => m.moduleId === module.id),
    })),
    {
      module: { id: '', title: 'Unfiled', summary: undefined, courseId, order: 999 },
      items: visibleMaterials.filter((m) => !m.moduleId || !modules.some((mod) => mod.id === m.moduleId)),
    },
  ].filter((group) => group.items.length > 0)

  return (
    <div className="page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/courses">Courses</Link>
        <Icon name="chevronRight" size={13} />
        <span>{course.code}</span>
      </nav>

      <header className="course-hero card" style={{ borderTopColor: course.color }}>
        <div className="course-hero__main">
          <div className="row" style={{ gap: 'var(--space-2)' }}>
            <span className="course-hero__code" style={{ background: course.color }}>
              {course.code}
            </span>
            <Badge tone={course.status === 'published' ? 'success' : course.status === 'draft' ? 'warning' : 'neutral'} dot>
              {course.status}
            </Badge>
            <Badge tone="info">{course.level}</Badge>
            <Badge>{course.credits} credits</Badge>
          </div>
          <h1>{course.title}</h1>
          <p className="course-hero__summary">{course.summary}</p>
          <div className="course-hero__meta">
            <span>
              <Icon name="semesters" size={14} /> {semesterLabel(semester)}
            </span>
            {category && (
              <span>
                <span className="tag-pill__swatch" style={{ background: category.color }} />
                {category.name}
              </span>
            )}
            {course.location && (
              <span>
                <Icon name="mapPin" size={14} /> {course.location}
              </span>
            )}
            <span>
              <Icon name="users" size={14} /> {course.enrolled}/{course.capacity} enrolled
            </span>
            <span>
              <Icon name="clock" size={14} /> Updated {relativeTime(course.updatedAt)}
            </span>
          </div>
          <TagList tags={tagsFor(data.tags, course.tagIds)} />
        </div>

        <div className="course-hero__aside">
          <div className="course-hero__actions">
            {mayManage && (
              <Button variant="primary" icon="plus" onClick={() => setMaterialForm({ open: true })}>
                Add material
              </Button>
            )}
            {mayEdit && (
              <Button icon="edit" onClick={() => setEditing(true)}>
                Edit
              </Button>
            )}
            {(mayEdit || mayManage) && (
              <Menu label="Course actions">
                {(close) => (
                  <>
                    {mayManage && (
                      <>
                        <button onClick={() => { setAssignmentForm({ open: true }); close() }}>
                          <Icon name="assignments" size={15} /> New assignment
                        </button>
                        <button onClick={() => { setAnnouncementOpen(true); close() }}>
                          <Icon name="megaphone" size={15} /> Post announcement
                        </button>
                        <button onClick={() => { setModuleOpen(true); close() }}>
                          <Icon name="semesters" size={15} /> Add module
                        </button>
                      </>
                    )}
                    {mayEdit && (
                      <>
                        <div className="menu__divider" />
                        <button
                          onClick={() => {
                            const target = data.semesters.find((s) => s.current) ?? data.semesters[0]
                            const copy = store.duplicateCourse(course.id, target?.id ?? course.semesterId)
                            close()
                            if (copy) {
                              notify(`Duplicated into ${semesterLabel(target)} as a draft.`, 'success', {
                                label: 'Open',
                                run: () => navigate(`/courses/${copy.id}`),
                              })
                            }
                          }}
                        >
                          <Icon name="copy" size={15} /> Duplicate for another semester
                        </button>
                        {course.status === 'archived' ? (
                          <button
                            onClick={() => {
                              store.restoreCourse(course.id)
                              close()
                              notify(`${course.code} restored.`)
                            }}
                          >
                            <Icon name="restore" size={15} /> Restore from archive
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              store.archiveCourse(course.id)
                              close()
                              notify(`${course.code} archived.`, 'info')
                            }}
                          >
                            <Icon name="archive" size={15} /> Archive course
                          </button>
                        )}
                        <button
                          className="is-danger"
                          onClick={() => {
                            close()
                            setConfirm({
                              title: `Delete ${course.code}?`,
                              message: `This removes the course and its ${stats.materials} materials and ${stats.assignments} assignments. It cannot be undone.`,
                              run: () => {
                                store.deleteCourse(course.id)
                                navigate('/courses')
                                notify(`${course.code} deleted.`, 'error')
                              },
                            })
                          }}
                        >
                          <Icon name="trash" size={15} /> Delete course
                        </button>
                      </>
                    )}
                  </>
                )}
              </Menu>
            )}
          </div>
          <div className="course-hero__stats">
            <div>
              <strong>{stats.materials}</strong>
              <span>Materials</span>
            </div>
            <div>
              <strong>{stats.openAssignments}</strong>
              <span>Open tasks</span>
            </div>
            <div>
              <strong>{stats.downloads}</strong>
              <span>Downloads</span>
            </div>
          </div>
        </div>
      </header>

      <div className="tabs" role="tablist">
        {TABS.map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
          >
            {item.label}
            {item.id === 'materials' && <span className="tabs__count">{courseMaterials.length}</span>}
            {item.id === 'assignments' && <span className="tabs__count">{courseAssignments.length}</span>}
            {item.id === 'announcements' && <span className="tabs__count">{courseAnnouncements.length}</span>}
            {item.id === 'staff' && <span className="tabs__count">{professors.length + tas.length}</span>}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <section className="grid grid--split">
          <div className="stack">
            <div className="card card--padded">
              <h3>About this course</h3>
              <p className="prose">{course.description}</p>
            </div>

            {course.objectives.length > 0 && (
              <div className="card card--padded">
                <h3>Learning objectives</h3>
                <ul className="checklist">
                  {course.objectives.map((objective) => (
                    <li key={objective}>
                      <Icon name="check" size={15} />
                      {objective}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {modules.length > 0 && (
              <div className="card">
                <div className="card__header">
                  <div>
                    <h3>Modules</h3>
                    <p>How the semester is sequenced.</p>
                  </div>
                  {mayManage && (
                    <Button size="sm" icon="plus" onClick={() => setModuleOpen(true)}>
                      Add
                    </Button>
                  )}
                </div>
                <ol className="module-list">
                  {modules.map((module) => {
                    const count = courseMaterials.filter((m) => m.moduleId === module.id).length
                    return (
                      <li key={module.id}>
                        <span className="module-list__index">{module.order}</span>
                        <span className="module-list__body">
                          <strong>{module.title}</strong>
                          {module.summary && <span>{module.summary}</span>}
                        </span>
                        <span className="muted-text">{pluralize(count, 'item')}</span>
                        {mayManage && (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon="trash"
                            iconOnly
                            aria-label={`Delete ${module.title}`}
                            onClick={() =>
                              setConfirm({
                                title: `Delete “${module.title}”?`,
                                message: 'Materials in this module are kept but become unfiled.',
                                run: () => {
                                  store.deleteModule(module.id)
                                  notify('Module deleted.', 'info')
                                },
                              })
                            }
                          />
                        )}
                      </li>
                    )
                  })}
                </ol>
              </div>
            )}
          </div>

          <div className="stack">
            {course.meetingTimes.length > 0 && (
              <div className="card card--padded">
                <h3>Schedule</h3>
                <ul className="schedule-list">
                  {course.meetingTimes.map((meeting, index) => (
                    <li key={index}>
                      <strong>{dayName(meeting.day)}</strong>
                      <span>
                        {meeting.start}–{meeting.end}
                      </span>
                      <span className="muted-text">{meeting.room ?? course.location}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {course.gradingScheme.length > 0 && (
              <div className="card card--padded">
                <h3>Grading</h3>
                <ul className="grading-list">
                  {course.gradingScheme.map((item) => (
                    <li key={item.label}>
                      <div className="row row--between">
                        <span>{item.label}</span>
                        <strong>{item.weight}%</strong>
                      </div>
                      <div className="meter">
                        <div
                          className="meter__fill"
                          style={{ width: `${item.weight}%`, background: course.color }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {course.prerequisites.length > 0 && (
              <div className="card card--padded">
                <h3>Prerequisites</h3>
                <ul className="checklist">
                  {course.prerequisites.map((item) => (
                    <li key={item}>
                      <Icon name="chevronRight" size={14} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="card card--padded">
              <h3>Details</h3>
              <dl className="detail-list">
                <div>
                  <dt>Language</dt>
                  <dd>{course.language}</dd>
                </div>
                <div>
                  <dt>Created</dt>
                  <dd>{formatDate(course.createdAt)}</dd>
                </div>
                <div>
                  <dt>Last updated</dt>
                  <dd>{formatDate(course.updatedAt)}</dd>
                </div>
                {course.archivedAt && (
                  <div>
                    <dt>Archived</dt>
                    <dd>{formatDate(course.archivedAt)}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </section>
      )}

      {tab === 'materials' && (
        <section className="stack">
          <div className="filter-bar card">
            <div className="filter-bar__search">
              <Icon name="search" size={16} />
              <input
                className="filter-bar__input"
                placeholder="Search materials in this course…"
                value={materialQuery}
                onChange={(event) => setMaterialQuery(event.target.value)}
              />
            </div>
            <div className="filter-bar__controls">
              <select
                className="select"
                value={materialType}
                aria-label="Material type"
                onChange={(event) => setMaterialType(event.target.value)}
              >
                <option value="">All types</option>
                <option value="slides">Slides</option>
                <option value="ebook">E-books</option>
                <option value="note">Notes</option>
                <option value="video">Videos</option>
                <option value="paper">Papers</option>
                <option value="dataset">Datasets</option>
                <option value="code">Code</option>
                <option value="link">Links</option>
              </select>
              {mayManage && (
                <Button variant="primary" icon="plus" onClick={() => setMaterialForm({ open: true })}>
                  Add material
                </Button>
              )}
            </div>
          </div>

          {visibleMaterials.length === 0 ? (
            <EmptyState
              icon="materials"
              title={courseMaterials.length === 0 ? 'No materials yet' : 'Nothing matches that filter'}
              description={
                courseMaterials.length === 0
                  ? 'Upload slides, readings, recordings, or datasets for this course.'
                  : 'Clear the search box or pick another type.'
              }
              action={
                mayManage && courseMaterials.length === 0 ? (
                  <Button variant="primary" icon="plus" onClick={() => setMaterialForm({ open: true })}>
                    Add the first material
                  </Button>
                ) : undefined
              }
            />
          ) : (
            groupedMaterials.map((group) => (
              <div key={group.module.id || 'unfiled'} className="stack--tight">
                <h3 className="group-heading">
                  {group.module.title}
                  <span className="muted-text">{pluralize(group.items.length, 'item')}</span>
                </h3>
                <div className="stack--tight">
                  {group.items.map((material) => (
                    <MaterialRow
                      key={material.id}
                      material={material}
                      canManage={mayManage}
                      highlighted={focusId === material.id}
                      onEdit={() => setMaterialForm({ open: true, material })}
                      onToggleVisibility={() => {
                        store.updateMaterial(material.id, { visible: !material.visible })
                        notify(material.visible ? 'Material hidden from students.' : 'Material is now visible.', 'info')
                      }}
                      onDelete={() =>
                        setConfirm({
                          title: `Delete “${material.title}”?`,
                          message: 'The entry is removed from this course. The linked file is untouched.',
                          run: () => {
                            store.deleteMaterial(material.id)
                            notify('Material deleted.', 'error')
                          },
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </section>
      )}

      {tab === 'assignments' && (
        <section className="stack">
          <div className="row row--between">
            <p className="muted-text">
              {pluralize(courseAssignments.filter((a) => a.published).length, 'published task')} ·{' '}
              {pluralize(courseAssignments.filter((a) => !a.published).length, 'draft')}
            </p>
            {mayManage && (
              <Button variant="primary" icon="plus" onClick={() => setAssignmentForm({ open: true })}>
                New assignment
              </Button>
            )}
          </div>
          {courseAssignments.length === 0 ? (
            <EmptyState
              icon="assignments"
              title="No assignments yet"
              description="Homework, labs, quizzes, and exams all appear here once created."
            />
          ) : (
            <div className="stack--tight">
              {courseAssignments.map((assignment) => (
                <AssignmentRow
                  key={assignment.id}
                  assignment={assignment}
                  canManage={mayManage}
                  highlighted={focusId === assignment.id}
                  onEdit={() => setAssignmentForm({ open: true, assignment })}
                  onTogglePublished={() => {
                    store.updateAssignment(assignment.id, { published: !assignment.published })
                    notify(assignment.published ? 'Assignment unpublished.' : 'Assignment published.', 'info')
                  }}
                  onDelete={() =>
                    setConfirm({
                      title: `Delete “${assignment.title}”?`,
                      message: 'Submission counts for this assignment are removed too.',
                      run: () => {
                        store.deleteAssignment(assignment.id)
                        notify('Assignment deleted.', 'error')
                      },
                    })
                  }
                />
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'announcements' && (
        <section className="stack">
          <div className="row row--between">
            <p className="muted-text">{pluralize(courseAnnouncements.length, 'announcement')}</p>
            {mayManage && (
              <Button variant="primary" icon="megaphone" onClick={() => setAnnouncementOpen(true)}>
                Post announcement
              </Button>
            )}
          </div>
          {courseAnnouncements.length === 0 ? (
            <EmptyState icon="megaphone" title="No announcements" description="Course-wide notices appear here." />
          ) : (
            <div className="stack--tight">
              {courseAnnouncements.map((announcement) => {
                const author = byId(data.people, announcement.authorId)
                return (
                  <article key={announcement.id} className="card card--padded announcement">
                    <div className="row row--between">
                      <div className="row" style={{ gap: 'var(--space-2)' }}>
                        {author && <Avatar person={author} size="sm" />}
                        <div>
                          <strong>{announcement.title}</strong>
                          <div className="muted-text">
                            {author?.name} · {relativeTime(announcement.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="row" style={{ gap: 'var(--space-2)' }}>
                        {announcement.pinned && (
                          <Badge tone="accent">
                            <Icon name="pin" size={11} /> Pinned
                          </Badge>
                        )}
                        {mayManage && (
                          <Menu label={`Actions for ${announcement.title}`}>
                            {(close) => (
                              <>
                                <button
                                  onClick={() => {
                                    store.updateAnnouncement(announcement.id, { pinned: !announcement.pinned })
                                    close()
                                  }}
                                >
                                  <Icon name="pin" size={15} /> {announcement.pinned ? 'Unpin' : 'Pin to top'}
                                </button>
                                <button
                                  className="is-danger"
                                  onClick={() => {
                                    store.deleteAnnouncement(announcement.id)
                                    close()
                                    notify('Announcement deleted.', 'error')
                                  }}
                                >
                                  <Icon name="trash" size={15} /> Delete
                                </button>
                              </>
                            )}
                          </Menu>
                        )}
                      </div>
                    </div>
                    <p className="prose">{announcement.body}</p>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      )}

      {tab === 'staff' && (
        <section className="stack">
          <div className="card">
            <div className="card__header">
              <div>
                <h3>Teaching staff</h3>
                <p>Professors own the course record; assistants manage its content.</p>
              </div>
              {mayEdit && (
                <Button size="sm" icon="edit" onClick={() => setEditing(true)}>
                  Change staff
                </Button>
              )}
            </div>
            <div className="card__body grid grid--cards">
              {[...professors, ...tas].map(
                (person) =>
                  person && (
                    <Link key={person.id} to={`/people/${person.id}`} className="person-card">
                      <Avatar person={person} size="lg" />
                      <div>
                        <strong>{person.name}</strong>
                        <span className="muted-text">{person.title ?? person.email}</span>
                        <div className="row" style={{ gap: 'var(--space-2)', marginTop: 6 }}>
                          <Badge tone={person.role === 'professor' ? 'accent' : 'info'}>
                            {person.role === 'professor' ? 'Professor' : 'Teaching assistant'}
                          </Badge>
                          {person.officeHours && <Badge>{person.officeHours}</Badge>}
                        </div>
                      </div>
                    </Link>
                  ),
              )}
            </div>
          </div>
        </section>
      )}

      {editing && (
        <CourseForm
          open
          course={course}
          ownerId={user.id}
          onClose={() => setEditing(false)}
          onSubmit={(values) => {
            store.updateCourse(course.id, values)
            setEditing(false)
            notify('Course updated.')
          }}
        />
      )}

      {materialForm.open && (
        <MaterialForm
          open
          courseId={course.id}
          authorId={user.id}
          material={materialForm.material}
          onClose={() => setMaterialForm({ open: false })}
          onSubmit={(values) => {
            if (materialForm.material) {
              store.updateMaterial(materialForm.material.id, values)
              notify('Material updated.')
            } else {
              store.addMaterial(values)
              notify('Material added to the course.')
            }
            setMaterialForm({ open: false })
            setTab('materials')
          }}
        />
      )}

      {assignmentForm.open && (
        <AssignmentForm
          open
          courseId={course.id}
          authorId={user.id}
          assignment={assignmentForm.assignment}
          onClose={() => setAssignmentForm({ open: false })}
          onSubmit={(values) => {
            if (assignmentForm.assignment) {
              store.updateAssignment(assignmentForm.assignment.id, values)
              notify('Assignment updated.')
            } else {
              store.addAssignment(values)
              notify('Assignment created.')
            }
            setAssignmentForm({ open: false })
            setTab('assignments')
          }}
        />
      )}

      {announcementOpen && (
        <AnnouncementModal
          courseId={course.id}
          authorId={user.id}
          onClose={() => setAnnouncementOpen(false)}
          onDone={() => {
            setAnnouncementOpen(false)
            setTab('announcements')
            notify('Announcement posted.')
          }}
        />
      )}

      {moduleOpen && (
        <ModuleModal
          courseId={course.id}
          nextOrder={modules.length + 1}
          onClose={() => setModuleOpen(false)}
          onDone={() => {
            setModuleOpen(false)
            notify('Module added.')
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

function AnnouncementModal({
  courseId,
  authorId,
  onClose,
  onDone,
}: {
  courseId: string
  authorId: string
  onClose: () => void
  onDone: () => void
}) {
  const { data, addAnnouncement } = useData()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [pinned, setPinned] = useState(false)
  const [author, setAuthor] = useState(authorId)

  return (
    <Modal
      open
      title="Post an announcement"
      description="Shown on the course page and on the dashboard of everyone teaching it."
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!title.trim() || !body.trim()}
            onClick={() => {
              addAnnouncement({ courseId, title: title.trim(), body: body.trim(), pinned, authorId: author })
              onDone()
            }}
          >
            Post
          </Button>
        </>
      }
    >
      <TextField
        label="Title"
        placeholder="Lab 2 deadline extended by 48 hours"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <TextAreaField
        label="Message"
        value={body}
        onChange={(event) => setBody(event.target.value)}
      />
      <SelectField label="Posting as" value={author} onChange={(event) => setAuthor(event.target.value)}>
        {data.people
          .filter((p) => p.role !== 'student')
          .map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
      </SelectField>
      <CheckboxField
        label="Pin to the top"
        hint="Pinned announcements stay above the rest."
        checked={pinned}
        onChange={(event) => setPinned(event.target.checked)}
      />
    </Modal>
  )
}

function ModuleModal({
  courseId,
  nextOrder,
  onClose,
  onDone,
}: {
  courseId: string
  nextOrder: number
  onClose: () => void
  onDone: () => void
}) {
  const { addModule } = useData()
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')

  return (
    <Modal
      open
      size="narrow"
      title="Add a module"
      description="Modules group materials into weeks or themes."
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!title.trim()}
            onClick={() => {
              addModule({ courseId, title: title.trim(), summary: summary.trim() || undefined, order: nextOrder })
              onDone()
            }}
          >
            Add module
          </Button>
        </>
      }
    >
      <TextField
        label="Title"
        placeholder="Virtual memory"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <TextField
        label="Summary"
        placeholder="Paging, TLBs, and page replacement"
        value={summary}
        onChange={(event) => setSummary(event.target.value)}
      />
    </Modal>
  )
}
