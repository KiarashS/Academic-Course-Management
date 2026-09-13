import { Link } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { usePreferences } from '../../store/PreferencesProvider'
import { site } from '../../content'

const mark = site.name
  .split(/\s+/)
  .map((word) => word[0])
  .join('')
  .slice(0, 2)
  .toUpperCase()

export function Header({
  onOpenSearch,
  onToggleSidebar,
}: {
  onOpenSearch: () => void
  onToggleSidebar: () => void
}) {
  const { resolvedTheme, toggleTheme } = usePreferences()

  return (
    <header className="d-header">
      <div className="d-header__inner">
        <button
          className="d-header__toggle"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
        >
          <Icon name="menu" size={18} />
        </button>

        <Link to="/" className="d-header__logo">
          <span className="d-header__mark">{mark}</span>
          {site.name}
        </Link>

        <div className="d-header__spacer" />

        <button className="d-header__search" onClick={onOpenSearch} aria-label="Search">
          <Icon name="search" size={15} />
          <span>Search courses and materials…</span>
          <kbd>/</kbd>
        </button>

        <div className="d-header__icons">
          <button
            className="d-header__icon"
            onClick={toggleTheme}
            aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} theme`}
            title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} theme`}
          >
            <Icon name={resolvedTheme === 'dark' ? 'sun' : 'moon'} size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}
