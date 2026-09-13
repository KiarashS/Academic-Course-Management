import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { CommandPalette } from './CommandPalette'
import { ToastRegion } from './ToastRegion'
import { usePreferences } from '../../store/PreferencesProvider'
import { DraftBanner } from './DraftBanner'

export function AppShell() {
  const { prefs, setPref } = usePreferences()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen((open) => !open)
      }
      // "/" focuses search, unless the user is already typing somewhere.
      const target = event.target as HTMLElement | null
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable
      if (event.key === '/' && !typing) {
        event.preventDefault()
        setPaletteOpen(true)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  // Each route change starts at the top of the page.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
    <div className="app-shell" data-collapsed={prefs.sidebarCollapsed}>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Sidebar open={mobileNavOpen} onNavigate={() => setMobileNavOpen(false)} />
      {mobileNavOpen && (
        <div className="sidebar-scrim" onClick={() => setMobileNavOpen(false)} aria-hidden="true" />
      )}
      <div className="main">
        <Topbar
          onOpenSearch={() => setPaletteOpen(true)}
          onToggleSidebar={() => setPref('sidebarCollapsed', !prefs.sidebarCollapsed)}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />
        <DraftBanner />
        <main id="main-content">
          <Outlet />
        </main>
      </div>
      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
      <ToastRegion />
    </div>
  )
}
