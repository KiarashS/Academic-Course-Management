import { NavLink } from 'react-router-dom'
import { Icon, type IconName } from '../ui/Icon'
import { useData } from '../../store/DataProvider'
import { useSession } from '../../store/session'
import { content } from '../../content/loadContent'

interface NavItem {
  to: string
  label: string
  icon: IconName
  count?: number
  end?: boolean
}

export function Sidebar({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  const { data } = useData()
  const { user, myCourses } = useSession()

  const active = data.courses.filter((c) => c.status !== 'archived')
  const archived = data.courses.filter((c) => c.status === 'archived')

  const teaching: NavItem[] = [
    { to: '/', label: 'Dashboard', icon: 'dashboard', end: true },
    { to: '/courses', label: 'Courses', icon: 'courses', count: active.length },
    { to: '/materials', label: 'Materials', icon: 'materials', count: data.materials.length },
    { to: '/assignments', label: 'Assignments', icon: 'assignments', count: data.assignments.length },
    { to: '/calendar', label: 'Calendar', icon: 'calendar' },
  ]

  const organise: NavItem[] = [
    { to: '/people', label: 'People', icon: 'people', count: data.people.length },
    { to: '/semesters', label: 'Semesters', icon: 'semesters', count: data.semesters.length },
    { to: '/taxonomy', label: 'Tags & categories', icon: 'tags', count: data.tags.length },
    { to: '/archive', label: 'Archive', icon: 'archive', count: archived.length },
  ]

  const renderItems = (items: NavItem[]) =>
    items.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        onClick={onNavigate}
        className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
      >
        <Icon name={item.icon} className="nav-link__icon" />
        <span>{item.label}</span>
        {item.count !== undefined && <span className="nav-link__count">{item.count}</span>}
      </NavLink>
    ))

  return (
    <aside className="sidebar" data-open={open} aria-label="Main navigation">
      <div className="sidebar__brand">
        <span className="sidebar__mark">
          {content.site.name
            .split(/\s+/)
            .map((word) => word[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </span>
        <span className="sidebar__name">
          <strong>{content.site.name}</strong>
          <span>{content.site.tagline}</span>
        </span>
      </div>

      <nav className="stack--tight" style={{ display: 'flex', flexDirection: 'column' }}>
        {renderItems(teaching)}
        <div className="sidebar__section">Organisation</div>
        {renderItems(organise)}
        <div className="sidebar__section">Account</div>
        {renderItems([
          { to: '/search', label: 'Search', icon: 'search' },
          { to: '/settings', label: 'Settings', icon: 'settings' },
        ])}
      </nav>

      <div className="sidebar__footer">
        <NavLink
          to={`/people/${user.id}`}
          onClick={onNavigate}
          className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
        >
          <Icon name="award" className="nav-link__icon" />
          <span>My teaching</span>
          <span className="nav-link__count">{myCourses.length}</span>
        </NavLink>
      </div>
    </aside>
  )
}
