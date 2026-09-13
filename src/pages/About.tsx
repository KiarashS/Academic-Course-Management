import { Link } from 'react-router-dom'
import { data, draftCount, missingFiles, site } from '../content'
import { pluralize } from '../lib/format'
import { Icon } from '../components/ui/Icon'

const REPO = 'https://github.com/KiarashS/Academic-Course-Management'

export function About() {
  const counts = [
    ['Courses', data.courses.length],
    ['Materials', data.materials.length],
    ['Coursework', data.assignments.length],
    ['People', data.people.length],
    ['Semesters', data.semesters.length],
    ['Tags', data.tags.length],
  ] as const

  return (
    <div className="d-container">
      <div className="page-title">
        <div>
          <h1>About this site</h1>
          <p>
            {site.name} is a static site. There is no database, no account, and nothing to log in
            to — every page is generated from one file in the repository and published to GitHub
            Pages.
          </p>
        </div>
      </div>

      <div className="d-split">
        <div className="post-stream">
          <article className="post">
            <div>
              <span className="post__glyph">
                <Icon name="note" size={20} />
              </span>
            </div>
            <div>
              <div className="post__meta">
                <span className="post__author">How the content is kept</span>
              </div>
              <div className="post__body">
                <p>
                  Courses, materials, coursework, announcements, people, semesters, categories and
                  tags all live in <code>content/courses.yaml</code>. Editing that file and pushing
                  it is what changes the site: a GitHub Actions workflow rebuilds and redeploys on
                  every push to <code>main</code>.
                </p>
                <p>
                  Because the site is static, it is also read-only. There are no forms here for
                  adding a course or uploading a file — those would need a server to write to.
                  Everything is authored in the repository instead, which means the content has a
                  full history and can be reviewed before it goes live.
                </p>
                <p>
                  A course marked <code>status: draft</code> is withheld from the site entirely
                  rather than shown with a label, since there is no sign-in to hide it behind.
                  {draftCount > 0
                    ? ` ${draftCount === 1 ? 'One course is' : `${draftCount} courses are`} being held back that way right now.`
                    : ''}
                </p>
              </div>
            </div>
          </article>

          <article className="post">
            <div>
              <span className="post__glyph">
                <Icon name="materials" size={20} />
              </span>
            </div>
            <div>
              <div className="post__meta">
                <span className="post__author">Where the files live</span>
              </div>
              <div className="post__body">
                <p>
                  Course files sit in <code>public/courses/&lt;course id&gt;/</code> and are
                  referenced from the YAML by filename. They are deliberately kept out of git so a
                  clone of the repository stays small; the build downloads them from a GitHub
                  release before publishing.
                </p>
                <p>
                  A material's size, icon and link are worked out from the file itself, so none of
                  that has to be written by hand.
                </p>
              </div>
            </div>
          </article>

          <article className="post">
            <div>
              <span className="post__glyph">
                <Icon name="external" size={20} />
              </span>
            </div>
            <div>
              <div className="post__meta">
                <span className="post__author">Contributing a correction</span>
              </div>
              <div className="post__body">
                <p>
                  Spotted a wrong date or a broken link? Open an issue or edit{' '}
                  <code>content/courses.yaml</code> and send a pull request — the workflow builds
                  every pull request, so a mistake in the file is caught before it reaches the site.
                </p>
                <p>
                  <a href={REPO} target="_blank" rel="noreferrer noopener">
                    <Icon name="external" size={14} /> View the repository
                  </a>
                </p>
              </div>
            </div>
          </article>
        </div>

        <aside className="d-stack">
          <section className="panel">
            <div className="panel__header">
              <h2>What is published</h2>
            </div>
            <div className="panel__body">
              <dl className="detail-list">
                {counts.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd className="tabular">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          {missingFiles.length > 0 && (
            <section className="panel">
              <div className="panel__header">
                <h2>Files not yet uploaded</h2>
              </div>
              <div className="panel__body">
                <div className="alert">
                  <Icon name="alert" size={15} />
                  <span>
                    {pluralize(missingFiles.length, 'file')} referenced by the content file is not
                    published yet, so those download links will not work.
                  </span>
                </div>
                <ul className="file-list">
                  {missingFiles.slice(0, 10).map((file) => (
                    <li key={file}>
                      <code>{file}</code>
                    </li>
                  ))}
                </ul>
                {missingFiles.length > 10 && (
                  <p className="muted">…and {missingFiles.length - 10} more.</p>
                )}
              </div>
            </section>
          )}

          <section className="panel">
            <div className="panel__header">
              <h2>Keyboard</h2>
            </div>
            <div className="panel__body">
              <dl className="detail-list">
                <div>
                  <dt>Search</dt>
                  <dd>
                    <kbd className="kbd">/</kbd>
                  </dd>
                </div>
                <div>
                  <dt>Close a dialog</dt>
                  <dd>
                    <kbd className="kbd">Esc</kbd>
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          <p className="sidebar-note">
            <Icon name="alert" size={13} />
            Looking for a course? Start from <Link to="/">all courses</Link>.
          </p>
        </aside>
      </div>
    </div>
  )
}
