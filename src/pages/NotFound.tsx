import { Link } from 'react-router-dom'
import { EmptyState } from '../components/ui/EmptyState'

export function NotFound() {
  return (
    <div className="page">
      <EmptyState
        icon="alert"
        title="Page not found"
        description="That address does not match any page in this workspace."
        action={
          <Link className="btn btn--primary" to="/">
            Back to the dashboard
          </Link>
        }
      />
    </div>
  )
}
