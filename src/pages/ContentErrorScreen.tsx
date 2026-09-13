import { Icon } from '../components/ui/Icon'

/**
 * Shown instead of the app when content/courses.yaml cannot be read. The whole
 * site comes from that file, so the message has to name the entry at fault.
 */
export function ContentErrorScreen({ error }: { error: Error }) {
  return (
    <div className="content-error">
      <div className="content-error__panel card">
        <span className="content-error__icon">
          <Icon name="alert" size={22} />
        </span>
        <h1>The content file could not be read</h1>
        <p>
          Everything on this site is built from <code>content/courses.yaml</code>. One entry in it
          is not valid, so nothing was loaded.
        </p>
        <pre className="content-error__message">{error.message}</pre>
        <p className="muted-text">
          Fix that entry and save — the page reloads on its own. Run{' '}
          <code>npm run check:content</code> to check file references at the same time.
        </p>
      </div>
    </div>
  )
}
