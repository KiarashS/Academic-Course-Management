import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { data } from '../content'
import { globalSearch, type SearchKind } from '../lib/selectors'
import { pluralize } from '../lib/format'
import { Icon, type IconName } from '../components/ui/Icon'
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
  assignment: 'Coursework',
  person: 'Person',
}

export function Search() {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const [kind, setKind] = useState<SearchKind | ''>('')

  const results = useMemo(() => globalSearch(data, query, 100), [query])
  const shown = kind ? results.filter((r) => r.kind === kind) : results

  const counts = (['course', 'material', 'assignment', 'person'] as SearchKind[])
    .map((k) => ({ kind: k, count: results.filter((r) => r.kind === k).length }))
    .filter((item) => item.count > 0)

  return (
    <div className="d-container">
      <div className="page-title">
        <div>
          <h1>Search</h1>
          <p>Courses, materials, coursework, and people are indexed together.</p>
        </div>
      </div>

      <div className="search-field search-field--large">
        <Icon name="search" size={20} />
        {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
        <input
          autoFocus
          value={query}
          placeholder="Search everything…"
          onChange={(event) =>
            setParams(event.target.value ? { q: event.target.value } : {}, { replace: true })
          }
        />
      </div>

      {query.trim() === '' ? (
        <EmptyState
          icon="search"
          title="Start typing"
          description="Search by course code, material title, instructor, or tag."
        />
      ) : results.length === 0 ? (
        <EmptyState
          icon="search"
          title={`No results for “${query}”`}
          description="Check the spelling, or try a course code such as CE-341."
        />
      ) : (
        <>
          <ul className="nav-pills">
            <li>
              <button className={kind === '' ? 'is-active' : undefined} onClick={() => setKind('')}>
                All<span className="nav-pills__count">{results.length}</span>
              </button>
            </li>
            {counts.map((item) => (
              <li key={item.kind}>
                <button
                  className={kind === item.kind ? 'is-active' : undefined}
                  onClick={() => setKind(item.kind)}
                >
                  {KIND_LABEL[item.kind]}
                  <span className="nav-pills__count">{item.count}</span>
                </button>
              </li>
            ))}
          </ul>

          <p className="muted">{pluralize(shown.length, 'result')}</p>

          <section className="panel">
            <ul className="panel__list">
              {shown.map((result) => (
                <li key={`${result.kind}-${result.id}`}>
                  <Link className="result-item" to={result.href}>
                    <Icon name={KIND_ICON[result.kind]} size={18} />
                    <span className="result-item__body">
                      <strong>{result.title}</strong>
                      <span>{result.subtitle}</span>
                    </span>
                    <span className="discourse-tag">{KIND_LABEL[result.kind]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  )
}
