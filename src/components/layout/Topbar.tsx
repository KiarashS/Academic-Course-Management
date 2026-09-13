import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'
import { Menu } from '../ui/Menu'
import { Avatar } from '../ui/Avatar'
import { useData } from '../../store/DataProvider'
import { usePreferences } from '../../store/PreferencesProvider'
import { useSession } from '../../store/session'
import { useToast } from '../../store/ToastProvider'

export function Topbar({
  onOpenSearch,
  onToggleSidebar,
  onOpenMobileNav,
}: {
  onOpenSearch: () => void
  onToggleSidebar: () => void
  onOpenMobileNav: () => void
}) {
  const { data } = useData()
  const { prefs, setPref, resolvedTheme } = usePreferences()
  const { user } = useSession()
  const { notify } = useToast()
  const navigate = useNavigate()

  const staff = data.people.filter((p) => p.role !== 'student')
  const students = data.people.filter((p) => p.role === 'student')

  return (
    <header className="topbar">
      <Button
        variant="ghost"
        icon="menu"
        iconOnly
        size="sm"
        className="mobile-only"
        aria-label="Open navigation"
        onClick={onOpenMobileNav}
      />
      <Button
        variant="ghost"
        icon="list"
        iconOnly
        size="sm"
        className="desktop-only"
        aria-label="Toggle sidebar"
        onClick={onToggleSidebar}
      />

      <button className="topbar__search" onClick={onOpenSearch}>
        <Icon name="search" size={16} />
        <span>Search courses, materials, people…</span>
        <kbd>⌘K</kbd>
      </button>

      <div className="topbar__spacer" />

      <div className="topbar__actions">
        <Button
          variant="ghost"
          icon={resolvedTheme === 'dark' ? 'sun' : 'moon'}
          iconOnly
          size="sm"
          aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} theme`}
          onClick={() => setPref('theme', resolvedTheme === 'dark' ? 'light' : 'dark')}
        />
        <Menu label="Account" icon="more">
          {(close) => (
            <>
              <div className="menu__label">Signed in as</div>
              <div
                className="row"
                style={{ padding: 'var(--space-2) var(--space-3)', gap: 'var(--space-2)' }}
              >
                <Avatar person={user} size="sm" />
                <span style={{ fontSize: 'var(--text-sm)' }}>{user.name}</span>
              </div>
              <div className="menu__divider" />
              <div className="menu__label">Switch account</div>
              {[...staff, ...students].map((person) => (
                <button
                  key={person.id}
                  onClick={() => {
                    setPref('currentUserId', person.id)
                    notify(`Now viewing as ${person.name}`, 'info')
                    close()
                  }}
                >
                  <Avatar person={person} size="sm" />
                  <span style={{ flex: 1 }}>{person.name}</span>
                  {person.id === prefs.currentUserId && <Icon name="check" size={14} />}
                </button>
              ))}
              <div className="menu__divider" />
              <button
                onClick={() => {
                  navigate('/settings')
                  close()
                }}
              >
                <Icon name="settings" size={15} />
                Settings
              </button>
            </>
          )}
        </Menu>
        <Avatar person={user} />
      </div>
    </header>
  )
}
