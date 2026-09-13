import { useState } from 'react'
import { useData } from '../store/DataProvider'
import { usePreferences } from '../store/PreferencesProvider'
import { useSession } from '../store/session'
import { useToast } from '../store/ToastProvider'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'
import { ConfirmDialog } from '../components/ui/Modal'
import { exportYaml } from '../content/exportYaml'
import { content } from '../content/loadContent'
import { formatDate } from '../lib/format'

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
  const [confirmRevert, setConfirmRevert] = useState(false)
  const [busy, setBusy] = useState(false)

  const download = (text: string, filename: string, type: string) => {
    const url = URL.createObjectURL(new Blob([text], { type }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const downloadYaml = async () => {
    setBusy(true)
    try {
      download(await exportYaml(data), 'courses.yaml', 'text/yaml')
      notify('Downloaded courses.yaml — replace content/courses.yaml with it and redeploy.')
    } catch (error) {
      notify(`Could not build the YAML: ${(error as Error).message}`, 'error')
    } finally {
      setBusy(false)
    }
  }

  const copyYaml = async () => {
    setBusy(true)
    try {
      await navigator.clipboard.writeText(await exportYaml(data))
      notify('Content file copied to the clipboard.')
    } catch {
      notify('The browser blocked clipboard access. Use Download instead.', 'error')
    } finally {
      setBusy(false)
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
            Appearance, the account you are viewing as, and how edits made here get back into the
            content file the site is built from.
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
                <h3>Publishing</h3>
                <p>
                  The site is built from <code>content/courses.yaml</code>. Anything you change in
                  the browser is a local draft until it goes back into that file.
                </p>
              </div>
            </div>
            <div className="card__body stack">
              <div className="setting-row">
                <div>
                  <strong>Status</strong>
                  <p className="muted-text">
                    {store.isDraft
                      ? `This browser holds unpublished edits${
                          store.draftSavedAt ? `, last saved ${formatDate(store.draftSavedAt, true)}` : ''
                        }. Nobody else can see them.`
                      : 'You are seeing exactly what the content file publishes.'}
                  </p>
                </div>
                <Badge tone={store.isDraft ? 'warning' : 'success'} dot>
                  {store.isDraft ? 'Local draft' : 'Published'}
                </Badge>
              </div>

              <div className="setting-row">
                <div>
                  <strong>Export the content file</strong>
                  <p className="muted-text">
                    Writes the whole workspace back out as YAML. Replace
                    <code> content/courses.yaml</code> with it, commit, and redeploy.
                  </p>
                </div>
                <div className="row" style={{ gap: 'var(--space-2)' }}>
                  <Button icon="copy" disabled={busy} onClick={copyYaml}>
                    Copy
                  </Button>
                  <Button variant="primary" icon="download" disabled={busy} onClick={downloadYaml}>
                    Download YAML
                  </Button>
                </div>
              </div>

              <div className="setting-row">
                <div>
                  <strong>Discard local changes</strong>
                  <p className="muted-text">
                    Drops the draft and reloads the published content file.
                  </p>
                </div>
                <Button variant="danger" icon="restore" disabled={!store.isDraft} onClick={() => setConfirmRevert(true)}>
                  Discard
                </Button>
              </div>

              <div className="setting-row">
                <div>
                  <strong>Raw snapshot</strong>
                  <p className="muted-text">
                    The in-memory dataset as JSON. Useful for debugging, not for publishing.
                  </p>
                </div>
                <Button
                  icon="download"
                  onClick={() => {
                    download(
                      JSON.stringify(data, null, 2),
                      `course-hub-${new Date().toISOString().slice(0, 10)}.json`,
                      'application/json',
                    )
                    notify('Snapshot downloaded.')
                  }}
                >
                  Export JSON
                </Button>
              </div>
            </div>
          </div>

          {content.missingFiles.length > 0 && (
            <div className="card">
              <div className="card__header">
                <div>
                  <h3>Missing files</h3>
                  <p>
                    Referenced by the content file but not present under
                    <code> public/courses/</code>. These links will 404 once deployed.
                  </p>
                </div>
                <Badge tone="warning">{content.missingFiles.length}</Badge>
              </div>
              <div className="card__body">
                <ul className="count-list">
                  {content.missingFiles.slice(0, 12).map((file) => (
                    <li key={file}>
                      <code style={{ textTransform: 'none' }}>{file}</code>
                    </li>
                  ))}
                </ul>
                {content.missingFiles.length > 12 && (
                  <p className="muted-text">
                    …and {content.missingFiles.length - 12} more. Run{' '}
                    <code>npm run check:content</code> for the full list.
                  </p>
                )}
              </div>
            </div>
          )}
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
        open={confirmRevert}
        title="Discard local changes?"
        message="Every edit you made in this browser is thrown away and the published content file is reloaded. Export the YAML first if you want to keep the changes."
        confirmLabel="Discard draft"
        onConfirm={() => {
          store.revertToPublished()
          notify('Back to the published content file.', 'info')
        }}
        onClose={() => setConfirmRevert(false)}
      />
    </div>
  )
}
