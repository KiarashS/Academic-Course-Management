import { useRef, useState } from 'react'
import type { AppData } from '../types'
import { useData } from '../store/DataProvider'
import { usePreferences } from '../store/PreferencesProvider'
import { useSession } from '../store/session'
import { useToast } from '../store/ToastProvider'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'
import { ConfirmDialog } from '../components/ui/Modal'

const COLLECTIONS = [
  'people',
  'semesters',
  'categories',
  'tags',
  'courses',
  'modules',
  'materials',
  'assignments',
  'announcements',
] as const

export function Settings() {
  const store = useData()
  const { data } = store
  const { prefs, setPref } = usePreferences()
  const { user } = useSession()
  const { notify } = useToast()
  const fileInput = useRef<HTMLInputElement>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `course-hub-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    notify('Workspace exported as JSON.')
  }

  const importData = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as Partial<AppData>
      const missing = COLLECTIONS.filter((key) => !Array.isArray(parsed[key]))
      if (missing.length > 0) {
        notify(`That file is missing: ${missing.join(', ')}.`, 'error')
        return
      }
      store.replaceData(parsed as AppData)
      notify('Workspace replaced from file.')
    } catch {
      notify('That file is not valid JSON.', 'error')
    }
  }

  const counts = COLLECTIONS.map((key) => ({ key, count: data[key].length }))

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="page-header__eyebrow">Preferences</p>
          <h1>Settings</h1>
          <p>
            Appearance, the account you are viewing as, and what happens to the data this workspace
            keeps in your browser.
          </p>
        </div>
      </header>

      <section className="grid grid--split">
        <div className="stack">
          <div className="card">
            <div className="card__header">
              <div>
                <h3>Appearance</h3>
                <p>Applies to this browser only.</p>
              </div>
            </div>
            <div className="card__body stack">
              <div className="setting-row">
                <div>
                  <strong>Theme</strong>
                  <p className="muted-text">System follows your operating system setting.</p>
                </div>
                <div className="segmented" role="group" aria-label="Theme">
                  {(['light', 'dark', 'system'] as const).map((option) => (
                    <button
                      key={option}
                      aria-pressed={prefs.theme === option}
                      onClick={() => setPref('theme', option)}
                    >
                      {option[0].toUpperCase() + option.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="setting-row">
                <div>
                  <strong>Density</strong>
                  <p className="muted-text">Compact tightens vertical spacing across the app.</p>
                </div>
                <div className="segmented" role="group" aria-label="Density">
                  {(['comfortable', 'compact'] as const).map((option) => (
                    <button
                      key={option}
                      aria-pressed={prefs.density === option}
                      onClick={() => setPref('density', option)}
                    >
                      {option[0].toUpperCase() + option.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="setting-row">
                <div>
                  <strong>Default course view</strong>
                  <p className="muted-text">Grid of cards, or a dense table.</p>
                </div>
                <div className="segmented" role="group" aria-label="Course view">
                  {(['grid', 'list'] as const).map((option) => (
                    <button
                      key={option}
                      aria-pressed={prefs.courseView === option}
                      onClick={() => setPref('courseView', option)}
                    >
                      {option[0].toUpperCase() + option.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="setting-row">
                <div>
                  <strong>Sidebar</strong>
                  <p className="muted-text">Collapse to icons to widen the content area.</p>
                </div>
                <div className="segmented" role="group" aria-label="Sidebar">
                  <button
                    aria-pressed={!prefs.sidebarCollapsed}
                    onClick={() => setPref('sidebarCollapsed', false)}
                  >
                    Expanded
                  </button>
                  <button
                    aria-pressed={prefs.sidebarCollapsed}
                    onClick={() => setPref('sidebarCollapsed', true)}
                  >
                    Collapsed
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card__header">
              <div>
                <h3>Data</h3>
                <p>Everything lives in this browser's local storage. Nothing is sent anywhere.</p>
              </div>
            </div>
            <div className="card__body stack">
              <div className="setting-row">
                <div>
                  <strong>Export workspace</strong>
                  <p className="muted-text">Download every record as a single JSON file.</p>
                </div>
                <Button icon="download" onClick={exportData}>
                  Export JSON
                </Button>
              </div>

              <div className="setting-row">
                <div>
                  <strong>Import workspace</strong>
                  <p className="muted-text">Replaces the current data with the contents of a file.</p>
                </div>
                <>
                  <input
                    ref={fileInput}
                    type="file"
                    accept="application/json"
                    className="visually-hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) void importData(file)
                      event.target.value = ''
                    }}
                  />
                  <Button icon="upload" onClick={() => fileInput.current?.click()}>
                    Choose file
                  </Button>
                </>
              </div>

              <div className="setting-row">
                <div>
                  <strong>Reset to sample data</strong>
                  <p className="muted-text">
                    Discards your changes and reloads the demo department.
                  </p>
                </div>
                <Button variant="danger" icon="restore" onClick={() => setConfirmReset(true)}>
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <div className="card__header">
              <div>
                <h3>Signed in as</h3>
                <p>Switch accounts to see what each role can do.</p>
              </div>
            </div>
            <div className="card__body stack--tight">
              <div className="row" style={{ gap: 'var(--space-3)' }}>
                <Avatar person={user} size="lg" />
                <div>
                  <strong>{user.name}</strong>
                  <div className="muted-text">{user.title ?? user.email}</div>
                </div>
              </div>
              <div className="stack--tight">
                {data.people
                  .filter((p) => p.role !== 'student')
                  .map((person) => (
                    <button
                      key={person.id}
                      className={`account-row${person.id === user.id ? ' is-active' : ''}`}
                      onClick={() => setPref('currentUserId', person.id)}
                    >
                      <Avatar person={person} size="sm" />
                      <span>
                        <strong>{person.name}</strong>
                        <span className="muted-text">{person.role === 'ta' ? 'Teaching assistant' : 'Professor'}</span>
                      </span>
                      {person.id === user.id && <Icon name="check" size={16} />}
                    </button>
                  ))}
              </div>
              <p className="muted-text">
                Professors can create, edit, archive, and delete courses. Teaching assistants manage
                materials, assignments, and announcements in the courses they are assigned to.
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card__header">
              <div>
                <h3>Workspace contents</h3>
                <p>What is stored right now.</p>
              </div>
            </div>
            <div className="card__body">
              <ul className="count-list">
                {counts.map((item) => (
                  <li key={item.key}>
                    <span>{item.key}</span>
                    <Badge>{item.count}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="card">
            <div className="card__header">
              <div>
                <h3>Keyboard shortcuts</h3>
              </div>
            </div>
            <div className="card__body">
              <ul className="count-list">
                <li>
                  <span>Open the quick switcher</span>
                  <kbd className="inline-kbd">⌘K</kbd>
                </li>
                <li>
                  <span>Search from anywhere</span>
                  <kbd className="inline-kbd">/</kbd>
                </li>
                <li>
                  <span>Close a dialog</span>
                  <kbd className="inline-kbd">Esc</kbd>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <ConfirmDialog
        open={confirmReset}
        title="Reset to sample data?"
        message="Every course, material, assignment, and person you added or edited is discarded. Export first if you want a copy."
        confirmLabel="Reset workspace"
        onConfirm={() => {
          store.resetDemoData()
          notify('Workspace reset to the sample department.', 'info')
        }}
        onClose={() => setConfirmReset(false)}
      />
    </div>
  )
}
