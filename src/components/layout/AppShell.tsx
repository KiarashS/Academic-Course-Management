import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { SearchMenu } from './SearchMenu'
import { ToastRegion } from './ToastRegion'
import { usePreferences } from '../../store/PreferencesProvider'

export function AppShell() {
  const { prefs, setPref } = usePreferences()
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable
      if (typing) return
      if (event.key === '/' || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k')) {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  // Each route change starts at the top of the page.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [location.pathname, location.search])

  const isDesktop = () => window.matchMedia('(min-width: 769px)').matches
  const sidebarState = mobileNav ? 'open' : prefs.sidebarOpen ? 'shown' : 'hidden'

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header
        onOpenSearch={() => setSearchOpen(true)}
        onToggleSidebar={() =>
          isDesktop() ? setPref('sidebarOpen', !prefs.sidebarOpen) : setMobileNav((open) => !open)
        }
      />
      <div className="d-shell" data-sidebar={sidebarState}>
        <Sidebar onNavigate={() => setMobileNav(false)} />
        {mobileNav && (
          <div className="d-sidebar-scrim" onClick={() => setMobileNav(false)} aria-hidden="true" />
        )}
        <main className="d-main" id="main-content">
          <Outlet />
        </main>
      </div>
      {searchOpen && <SearchMenu onClose={() => setSearchOpen(false)} />}
      <ToastRegion />
    </>
  )
}
