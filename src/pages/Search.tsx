import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useData } from '../store/DataProvider'
import { globalSearch, type SearchKind } from '../lib/selectors'
import { pluralize } from '../lib/format'
import { Icon, type IconName } from '../components/ui/Icon'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'

const KIND_ICON: Record<SearchKind, IconName> = {
  course: 'courses',
  material: 'materials',
  assignment: 'assignments',
  person: 'people',
}

const KIND_LABEL: Record<SearchKind, string> = {
  course: 'Course',
  material: 'Material',
  assignment: 'Assignment',
  person: 'Person',
}

export function Search() {
  const { data } = useData()
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const [kind, setKind] = useState<SearchKind | ''>('')

  const results = useMemo(() => globalSearch(data, query, 100), [data, query])
  const filtered = kind ? results.filter((r) => r.kind === kind) : results

  const counts = (['course', 'material', 'assignment', 'person'] as SearchKind[]).map((k) => ({
    kind: k,
    count: results.filter((r) => r.kind === k).length,
  }))

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="page-header__eyebrow">Search</p>
          <h1>Everything, in one query</h1>
          <p>
            Courses, materials, assignments, and people are indexed together. Press{' '}
            <kbd className="inline-kbd">⌘K</kbd> anywhere for the quick switcher.
          </p>
        </div>
      </header>

      <div className="search-input card">
        <Icon name="search" size={20} />
        {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
        <input
          autoFocus
          value={query}
          placeholder="Search the whole workspace…"
          onChange={(event) => setParams(event.target.value ? { q: event.target.value } : {}, { replace: true })}
        />
        {query && (
          <button
            className="btn btn--ghost btn--sm btn--icon"
            aria-label="Clear"
            onClick={() => setParams({}, { replace: true })}
          >
            <Icon name="close" size={16} />
          </button>
        )}
      </div>

      {query.trim() === '' ? (
        <EmptyState
          icon="search"
          title="Start typing"
          description="Search by course code, material title, assignment name, instructor, or tag."
        />
      ) : results.length === 0 ? (
        <EmptyState
          icon="search"
          title={`No results for “${query}”`}
          description="Check the spelling, or try a course code such as CE-341."
        />
      ) : (
        <>
          <div className="segmented" role="group" aria-label="Result type">
            <button aria-pressed={kind === ''} onClick={() => setKind('')}>
              All <span className="tabs__count">{results.length}</span>
            </button>
            {counts
              .filter((item) => item.count > 0)
              .map((item) => (
                <button
                  key={item.kind}
                  aria-pressed={kind === item.kind}
                  onClick={() => setKind(item.kind)}
                >
                  {KIND_LABEL[item.kind]}s <span className="tabs__count">{item.count}</span>
                </button>
              ))}
          </div>

          <p className="muted-text">{pluralize(filtered.length, 'result')}</p>

          <div className="stack--tight">
            {filtered.map((result) => (
              <Link key={`${result.kind}-${result.id}`} to={result.href} className="result-row card">
                <span className="result-row__icon">
                  <Icon name={KIND_ICON[result.kind]} size={18} />
                </span>
                <span className="result-row__body">
                  <strong>{result.title}</strong>
                  <span>{result.subtitle}</span>
                </span>
                <span className="row" style={{ gap: 'var(--space-2)' }}>
                  {result.meta && <Badge>{result.meta}</Badge>}
                  <Badge tone="accent">{KIND_LABEL[result.kind]}</Badge>
                </span>
                <Icon name="chevronRight" size={16} />
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
