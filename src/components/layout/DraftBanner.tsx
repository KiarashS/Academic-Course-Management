import { Link } from 'react-router-dom'
import { useData } from '../../store/DataProvider'
import { Icon } from '../ui/Icon'

/**
 * On a static site the browser cannot publish anything. This makes it obvious
 * that local edits exist only here until they are written back to the YAML.
 */
export function DraftBanner() {
  const { isDraft } = useData()
  if (!isDraft) return null
  return (
    <div className="draft-banner" role="status">
      <Icon name="alert" size={15} />
      <p>
        You are viewing a local draft. These edits live in this browser only — export the content
        file to publish them.
      </p>
      <Link className="btn btn--sm btn--secondary" to="/settings">
        Export
      </Link>
    </div>
  )
}
