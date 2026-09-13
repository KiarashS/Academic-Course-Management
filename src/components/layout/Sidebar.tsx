import { Link, useLocation } from 'react-router-dom'
import { Icon, type IconName } from '../ui/Icon'
import { data } from '../../content'
import { semesterLabel } from '../../lib/selectors'

interface Item {
  to: string
  label: string
  icon: IconName
  count?: number
}

export function Sidebar({ onNavigate }: { onNavigate: () => void }) {
  const location = useLocation()
  const here = `${location.pathname}${location.search}`

  /** Active when the whole path-and-query matches, so filtered links differ. */
  const isActive = (to: string) => {
    if (to.includes('?')) return here === to
    if (to === '/') return location.pathname === '/' && location.search === ''
    return location.pathname === to || location.pathname.startsWith(`${to}/`)
  }

  const current = data.semesters.find((s) => s.current)
  const active = data.courses.filter((c) => c.status === 'published')
  const archived = data.courses.filter((c) => c.status === 'archived')
  const thisTerm = active.filter((c) => c.semesterId === current?.id)

  const sections: { heading: string; items: Item[] }[] = [
    {
      heading: 'Courses',
      items: [
        { to: '/', label: 'All courses', icon: 'courses', count: active.length },
        {
          to: `/?semester=${current?.id ?? ''}`,
          label: current ? semesterLabel(current) : 'Current term',
          icon: 'semesters',
          count: thisTerm.length,
        },
        { to: '/archive', label: 'Archive', icon: 'archive', count: archived.length },
      ],
    },
    {
      heading: 'Browse',
      items: [
        { to: '/materials', label: 'Materials', icon: 'materials', count: data.materials.length },
        {
          to: '/assignments',
          label: 'Coursework',
          icon: 'assignments',
          count: data.assignments.length,
        },
        { to: '/calendar', label: 'Calendar', icon: 'calendar' },
      ],
    },
    {
      heading: 'Organisation',
      items: [
        { to: '/categories', label: 'Categories', icon: 'category', count: data.categories.length },
        { to: '/tags', label: 'Tags', icon: 'tags', count: data.tags.length },
        { to: '/semesters', label: 'Semesters', icon: 'semesters', count: data.semesters.length },
        { to: '/people', label: 'People', icon: 'people', count: data.people.length },
      ],
    },
  ]

  return (
    <nav className="d-sidebar" aria-label="Site sections">
      {sections.map((section) => (
        <div className="d-sidebar__section" key={section.heading}>
          <div className="d-sidebar__heading">{section.heading}</div>
          {section.items.map((item) => (
            <Link
              key={item.to + item.label}
              to={item.to}
              onClick={onNavigate}
              aria-current={isActive(item.to) ? 'page' : undefined}
              className={`d-sidebar__link${isActive(item.to) ? ' is-active' : ''}`}
            >
              <Icon name={item.icon} size={16} />
              <span className="d-sidebar__label">{item.label}</span>
              {item.count !== undefined && <span className="d-sidebar__count">{item.count}</span>}
            </Link>
          ))}
        </div>
      ))}

      <div className="d-sidebar__section">
        <Link
          to="/about"
          onClick={onNavigate}
          aria-current={isActive('/about') ? 'page' : undefined}
          className={`d-sidebar__link${isActive('/about') ? ' is-active' : ''}`}
        >
          <Icon name="alert" size={16} />
          <span className="d-sidebar__label">About this site</span>
        </Link>
      </div>
    </nav>
  )
}
