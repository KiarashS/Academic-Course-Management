import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../store/DataProvider'
import { useSession } from '../store/session'
import { dayShort, formatDate, isSameDay } from '../lib/format'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'

interface DayEvent {
  id: string
  kind: 'session' | 'deadline'
  label: string
  detail: string
  color: string
  href: string
  time: string
}

const startOfGrid = (month: Date) => {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const start = new Date(first)
  start.setDate(first.getDate() - first.getDay())
  return start
}

export function Calendar() {
  const { data } = useData()
  const { myCourses } = useSession()
  const [cursor, setCursor] = useState(() => new Date())
  const [onlyMine, setOnlyMine] = useState(true)
  const [selected, setSelected] = useState<Date>(() => new Date())

  const courses = useMemo(() => {
    const pool = onlyMine && myCourses.length > 0 ? myCourses : data.courses
    return pool.filter((c) => c.status !== 'archived')
  }, [data.courses, myCourses, onlyMine])

  const eventsFor = useMemo(() => {
    return (day: Date): DayEvent[] => {
      const events: DayEvent[] = []
      for (const course of courses) {
        for (const meeting of course.meetingTimes) {
          if (meeting.day !== day.getDay()) continue
          const semester = data.semesters.find((s) => s.id === course.semesterId)
          if (semester) {
            const start = new Date(semester.startDate)
            const end = new Date(semester.endDate)
            if (day < start || day > end) continue
          }
          events.push({
            id: `${course.id}-${meeting.day}-${meeting.start}`,
            kind: 'session',
            label: course.code,
            detail: `${meeting.start}–${meeting.end} · ${meeting.room ?? course.location ?? ''}`,
            color: course.color,
            href: `/courses/${course.id}`,
            time: meeting.start,
          })
        }
      }
      for (const assignment of data.assignments) {
        const course = courses.find((c) => c.id === assignment.courseId)
        if (!course) continue
        if (!isSameDay(new Date(assignment.dueDate), day)) continue
        events.push({
          id: assignment.id,
          kind: 'deadline',
          label: assignment.title,
          detail: `${course.code} · ${assignment.points} pts${assignment.published ? '' : ' · draft'}`,
          color: course.color,
          href: `/courses/${course.id}?tab=assignments&focus=${assignment.id}`,
          time: new Date(assignment.dueDate).toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
          }),
        })
      }
      return events.sort((a, b) => a.time.localeCompare(b.time))
    }
  }, [courses, data.assignments, data.semesters])

  const gridStart = startOfGrid(cursor)
  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + index)
    return date
  })

  const today = new Date()
  const selectedEvents = eventsFor(selected)

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="page-header__eyebrow">Schedule</p>
          <h1>Calendar</h1>
          <p>Class sessions from each course timetable, plus every assignment deadline.</p>
        </div>
        <div className="page-header__actions">
          <Button
            variant={onlyMine ? 'primary' : 'secondary'}
            icon="award"
            aria-pressed={onlyMine}
            onClick={() => setOnlyMine((value) => !value)}
          >
            My courses only
          </Button>
          <Button
            onClick={() => {
              setCursor(new Date())
              setSelected(new Date())
            }}
          >
            Today
          </Button>
        </div>
      </header>

      <section className="grid grid--split">
        <div className="card calendar">
          <div className="calendar__header">
            <Button
              variant="ghost"
              icon="chevronLeft"
              iconOnly
              size="sm"
              aria-label="Previous month"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            />
            <h2>
              {cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </h2>
            <Button
              variant="ghost"
              icon="chevronRight"
              iconOnly
              size="sm"
              aria-label="Next month"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            />
          </div>

          <div className="calendar__weekdays">
            {[0, 1, 2, 3, 4, 5, 6].map((day) => (
              <span key={day}>{dayShort(day)}</span>
            ))}
          </div>

          <div className="calendar__grid">
            {days.map((day) => {
              const events = eventsFor(day)
              const outside = day.getMonth() !== cursor.getMonth()
              return (
                <button
                  key={day.toISOString()}
                  className={[
                    'calendar__day',
                    outside && 'is-outside',
                    isSameDay(day, today) && 'is-today',
                    isSameDay(day, selected) && 'is-selected',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => setSelected(day)}
                >
                  <span className="calendar__date">{day.getDate()}</span>
                  <span className="calendar__events">
                    {events.slice(0, 3).map((event) => (
                      <span
                        key={event.id}
                        className={`calendar__event calendar__event--${event.kind}`}
                        style={{ borderLeftColor: event.color }}
                        title={`${event.label} · ${event.detail}`}
                      >
                        {event.kind === 'deadline' && <Icon name="assignments" size={10} />}
                        <span className="calendar__event-label">{event.label}</span>
                      </span>
                    ))}
                    {events.length > 3 && (
                      <span className="calendar__more">+{events.length - 3} more</span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="card">
          <div className="card__header">
            <div>
              <h3>{formatDate(selected)}</h3>
              <p>
                {selectedEvents.length === 0
                  ? 'Nothing scheduled.'
                  : `${selectedEvents.length} entr${selectedEvents.length === 1 ? 'y' : 'ies'}`}
              </p>
            </div>
          </div>
          <div className="card__body">
            {selectedEvents.length === 0 ? (
              <EmptyState icon="calendar" title="Free day" description="No sessions or deadlines." />
            ) : (
              <ul className="agenda">
                {selectedEvents.map((event) => (
                  <li key={event.id}>
                    <span className="agenda__time">{event.time}</span>
                    <span className="agenda__bar" style={{ background: event.color }} />
                    <span className="agenda__body">
                      <Link to={event.href} className="link-strong">
                        {event.label}
                      </Link>
                      <span className="muted-text">{event.detail}</span>
                    </span>
                    <Badge tone={event.kind === 'deadline' ? 'warning' : 'info'}>
                      {event.kind === 'deadline' ? 'Due' : 'Class'}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
