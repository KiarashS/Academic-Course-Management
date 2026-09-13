import { Link, useParams } from 'react-router-dom'
import { data } from '../content'
import { byId, courseStats } from '../lib/selectors'
import { pluralize } from '../lib/format'
import { CourseTable } from '../components/courses/CourseRow'
import { CategoryBadge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { Icon } from '../components/ui/Icon'

/** The index, modelled on Discourse's category boxes. */
export function Categories() {
  return (
    <div className="d-container">
      <div className="page-title">
        <div>
          <h1>Categories</h1>
          <p>Every course belongs to one subject area.</p>
        </div>
      </div>

      <div className="category-grid">
        {data.categories.map((category) => {
          const courses = data.courses.filter((c) => c.categoryId === category.id)
          const active = courses.filter((c) => c.status !== 'archived')
          const materials = courses.reduce((sum, c) => sum + courseStats(data, c.id).materials, 0)
          return (
            <section className="category-box" key={category.id} style={{ borderLeftColor: category.color }}>
              <h2>
                <Link to={`/categories/${category.id}`} className="category-box__title">
                  {category.name}
                </Link>
              </h2>
              {category.description && <p>{category.description}</p>}
              <div className="category-box__stats">
                <span>
                  <Icon name="courses" size={13} /> {pluralize(active.length, 'course')}
                </span>
                <span>
                  <Icon name="materials" size={13} /> {pluralize(materials, 'material')}
                </span>
              </div>
              <ul className="category-box__list">
                {active.slice(0, 4).map((course) => (
                  <li key={course.id}>
                    <Link to={`/courses/${course.id}`}>{course.title}</Link>
                    <span className="topic-list__code">{course.code}</span>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}

export function CategoryDetail() {
  const { categoryId = '' } = useParams()
  const category = byId(data.categories, categoryId)
  const courses = data.courses.filter(
    (c) => c.categoryId === categoryId && c.status !== 'archived',
  )

  if (!category) {
    return (
      <EmptyState
        icon="category"
        title="Category not found"
        action={
          <Link className="btn btn--primary" to="/categories">
            All categories
          </Link>
        }
      />
    )
  }

  return (
    <div className="d-container">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/categories">Categories</Link>
        <Icon name="chevronRight" size={12} />
        <CategoryBadge category={category} link={false} />
      </nav>

      <div className="page-title">
        <div>
          <h1>{category.name}</h1>
          {category.description && <p>{category.description}</p>}
        </div>
      </div>

      {courses.length === 0 ? (
        <EmptyState icon="courses" title="No courses in this category" />
      ) : (
        <CourseTable courses={courses} />
      )}
    </div>
  )
}
