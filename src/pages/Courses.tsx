import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { CourseFilters } from '../types'
import { useData } from '../store/DataProvider'
import { useSession } from '../store/session'
import { useToast } from '../store/ToastProvider'
import { usePreferences } from '../store/PreferencesProvider'
import { defaultCourseFilters, filterCourses } from '../lib/selectors'
import { pluralize } from '../lib/format'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { EmptyState } from '../components/ui/EmptyState'
import { CourseCard, CourseRow } from '../components/courses/CourseCard'
import { CourseForm } from '../components/courses/CourseForm'

export function Courses() {
  const { data, addCourse } = useData()
  const { user, canCreateCourse } = useSession()
  const { notify } = useToast()
  const { prefs, setPref } = usePreferences()
  const [params, setParams] = useSearchParams()
  const [creating, setCreating] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const filters: CourseFilters = useMemo(
    () => ({
      ...defaultCourseFilters,
      query: params.get('q') ?? '',
      semesterId: params.get('semester') ?? '',
      categoryId: params.get('category') ?? '',
      instructorId: params.get('instructor') ?? '',
      level: params.get('level') ?? '',
      status: (params.get('status') as CourseFilters['status']) ?? 'all',
      sort: (params.get('sort') as CourseFilters['sort']) ?? 'recent',
      tagIds: params.get('tags')?.split(',').filter(Boolean) ?? [],
    }),
    [params],
  )

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const toggleTag = (tagId: string) => {
    const next = filters.tagIds.includes(tagId)
      ? filters.tagIds.filter((t) => t !== tagId)
      : [...filters.tagIds, tagId]
    setFilter('tags', next.join(','))
  }

  const courses = useMemo(() => filterCourses(data, filters), [data, filters])
  const activeFilterCount = [
    filters.semesterId,
    filters.categoryId,
    filters.instructorId,
    filters.level,
    filters.status !== 'all' ? filters.status : '',
  ].filter(Boolean).length + filters.tagIds.length

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="page-header__eyebrow">Catalogue</p>
          <h1>Courses</h1>
          <p>
            Every course in the department, filtered by semester, category, tag, or instructor.
            Archived courses live on their own page.
          </p>
        </div>
        <div className="page-header__actions">
          <div className="segmented" role="group" aria-label="View mode">
            <button
              aria-pressed={prefs.courseView === 'grid'}
              onClick={() => setPref('courseView', 'grid')}
            >
              <Icon name="grid" size={14} /> Grid
            </button>
            <button
              aria-pressed={prefs.courseView === 'list'}
              onClick={() => setPref('courseView', 'list')}
            >
              <Icon name="list" size={14} /> List
            </button>
          </div>
          {canCreateCourse && (
            <Button variant="primary" icon="plus" onClick={() => setCreating(true)}>
              New course
            </Button>
          )}
        </div>
      </header>

      <section className="filter-bar card">
        <div className="filter-bar__search">
          <Icon name="search" size={16} />
          <input
            className="filter-bar__input"
            placeholder="Search by code, title, tag, or instructor…"
            value={filters.query}
            onChange={(event) => setFilter('q', event.target.value)}
          />
          {filters.query && (
            <Button
              variant="ghost"
              size="sm"
              icon="close"
              iconOnly
              aria-label="Clear search"
              onClick={() => setFilter('q', '')}
            />
          )}
        </div>

        <div className="filter-bar__controls">
          <select
            className="select"
            value={filters.semesterId}
            aria-label="Semester"
            onChange={(event) => setFilter('semester', event.target.value)}
          >
            <option value="">All semesters</option>
            {data.semesters.map((semester) => (
              <option key={semester.id} value={semester.id}>
                {semester.term} {semester.year}
              </option>
            ))}
          </select>
          <select
            className="select"
            value={filters.categoryId}
            aria-label="Category"
            onChange={(event) => setFilter('category', event.target.value)}
          >
            <option value="">All categories</option>
            {data.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            className="select"
            value={filters.sort}
            aria-label="Sort by"
            onChange={(event) => setFilter('sort', event.target.value)}
          >
            <option value="recent">Recently updated</option>
            <option value="code">Course code</option>
            <option value="title">Title</option>
            <option value="enrollment">Enrolment</option>
          </select>
          <Button
            icon="filter"
            onClick={() => setShowFilters((value) => !value)}
            aria-expanded={showFilters}
          >
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </Button>
        </div>

        {showFilters && (
          <div className="filter-bar__advanced">
            <div className="field">
              <span className="field__label">Instructor</span>
              <select
                className="select"
                value={filters.instructorId}
                onChange={(event) => setFilter('instructor', event.target.value)}
              >
                <option value="">Anyone</option>
                <optgroup label="Professors">
                  {data.people
                    .filter((p) => p.role === 'professor')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Teaching assistants">
                  {data.people
                    .filter((p) => p.role === 'ta')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>
            <div className="field">
              <span className="field__label">Level</span>
              <select
                className="select"
                value={filters.level}
                onChange={(event) => setFilter('level', event.target.value)}
              >
                <option value="">Any level</option>
                <option value="undergraduate">Undergraduate</option>
                <option value="graduate">Graduate</option>
              </select>
            </div>
            <div className="field">
              <span className="field__label">Status</span>
              <select
                className="select"
                value={filters.status}
                onChange={(event) => setFilter('status', event.target.value)}
              >
                <option value="all">Published and drafts</option>
                <option value="published">Published only</option>
                <option value="draft">Drafts only</option>
              </select>
            </div>
            <div className="field field--full">
              <span className="field__label">Tags</span>
              <div className="chip-row">
                {data.tags.map((tag) => (
                  <button
                    key={tag.id}
                    className={`tag-pill${filters.tagIds.includes(tag.id) ? ' is-selected' : ''}`}
                    onClick={() => toggleTag(tag.id)}
                    aria-pressed={filters.tagIds.includes(tag.id)}
                  >
                    <span className="tag-pill__swatch" style={{ background: tag.color }} />
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
            {activeFilterCount > 0 && (
              <div className="field--full">
                <Button
                  size="sm"
                  icon="close"
                  onClick={() => setParams(filters.query ? { q: filters.query } : {}, { replace: true })}
                >
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        )}
      </section>

      <div className="row row--between">
        <p className="muted-text">{pluralize(courses.length, 'course')} found</p>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          icon="courses"
          title="No courses match those filters"
          description="Try removing a tag or widening the semester range."
          action={
            <Button onClick={() => setParams({}, { replace: true })}>Reset filters</Button>
          }
        />
      ) : prefs.courseView === 'grid' ? (
        <div className="grid grid--cards">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Semester</th>
                <th>Staff</th>
                <th className="numeric">Materials</th>
                <th className="numeric">Assignments</th>
                <th className="numeric">Enrolled</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <CourseRow key={course.id} course={course} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <CourseForm
          open
          ownerId={user.id}
          onClose={() => setCreating(false)}
          onSubmit={(values) => {
            const course = addCourse(values)
            setCreating(false)
            notify(`${course.code} created as a draft.`)
          }}
        />
      )}
    </div>
  )
}
