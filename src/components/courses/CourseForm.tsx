import { useState } from 'react'
import type { Course, CourseLevel, CourseStatus, MeetingTime } from '../../types'
import { useData } from '../../store/DataProvider'
import { dayShort } from '../../lib/format'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'
import { Modal } from '../ui/Modal'
import { CheckboxField, SelectField, TextAreaField, TextField } from '../ui/Field'
import { TagPicker } from '../ui/TagPicker'
import { Avatar } from '../ui/Avatar'

const COLORS = [
  '#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899',
  '#8b5cf6', '#f43f5e', '#14b8a6', '#a855f7', '#64748b',
]

type Values = Omit<Course, 'id' | 'createdAt' | 'updatedAt'>

const blank = (semesterId: string, categoryId: string, ownerId: string): Values => ({
  code: '',
  title: '',
  summary: '',
  description: '',
  semesterId,
  categoryId,
  tagIds: [],
  professorIds: ownerId ? [ownerId] : [],
  taIds: [],
  status: 'draft',
  level: 'undergraduate',
  credits: 3,
  capacity: 40,
  enrolled: 0,
  language: 'English',
  color: COLORS[0],
  location: '',
  meetingTimes: [],
  prerequisites: [],
  objectives: [],
  gradingScheme: [],
})

export function CourseForm({
  open,
  course,
  ownerId,
  onClose,
  onSubmit,
}: {
  open: boolean
  course?: Course
  ownerId: string
  onClose: () => void
  onSubmit: (values: Values) => void
}) {
  const { data, addTag } = useData()
  const [values, setValues] = useState<Values>(
    () =>
      course ??
      blank(
        data.semesters.find((s) => s.current)?.id ?? data.semesters[0]?.id ?? '',
        data.categories[0]?.id ?? '',
        ownerId,
      ),
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = <K extends keyof Values>(key: K, value: Values[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }))

  const professors = data.people.filter((p) => p.role === 'professor')
  const tas = data.people.filter((p) => p.role === 'ta')

  const toggleId = (key: 'professorIds' | 'taIds', id: string) =>
    set(key, values[key].includes(id) ? values[key].filter((v) => v !== id) : [...values[key], id])

  const updateMeeting = (index: number, patch: Partial<MeetingTime>) =>
    set(
      'meetingTimes',
      values.meetingTimes.map((m, i) => (i === index ? { ...m, ...patch } : m)),
    )

  const submit = () => {
    const nextErrors: Record<string, string> = {}
    if (!values.code.trim()) nextErrors.code = 'A course code is required.'
    if (!values.title.trim()) nextErrors.title = 'A title is required.'
    if (values.professorIds.length === 0) nextErrors.professors = 'Assign at least one professor.'
    if (values.capacity < values.enrolled)
      nextErrors.capacity = 'Capacity cannot be below current enrolment.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    onSubmit({ ...values, code: values.code.trim().toUpperCase(), title: values.title.trim() })
  }

  const weightTotal = values.gradingScheme.reduce((sum, item) => sum + (item.weight || 0), 0)

  return (
    <Modal
      open={open}
      size="wide"
      title={course ? `Edit ${course.code}` : 'New course'}
      description={
        course
          ? 'Changes are saved to this workspace immediately.'
          : 'Set up the course record. Materials and assignments are added afterwards.'
      }
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>
            {course ? 'Save changes' : 'Create course'}
          </Button>
        </>
      }
    >
      <section className="field-grid">
        <TextField
          label="Course code"
          placeholder="CE-341"
          value={values.code}
          error={errors.code}
          onChange={(e) => set('code', e.target.value)}
        />
        <TextField
          label="Title"
          placeholder="Operating Systems"
          value={values.title}
          error={errors.title}
          className="field--full"
          onChange={(e) => set('title', e.target.value)}
        />
        <TextAreaField
          label="Summary"
          hint="One or two sentences shown on the course card."
          className="field--full"
          style={{ minHeight: 64 }}
          value={values.summary}
          onChange={(e) => set('summary', e.target.value)}
        />
        <TextAreaField
          label="Description"
          hint="The full description shown on the course overview tab."
          className="field--full"
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
        />
      </section>

      <section className="field-grid">
        <SelectField
          label="Semester"
          value={values.semesterId}
          onChange={(e) => set('semesterId', e.target.value)}
        >
          {data.semesters.map((semester) => (
            <option key={semester.id} value={semester.id}>
              {semester.term} {semester.year}
              {semester.current ? ' (current)' : ''}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Category"
          value={values.categoryId}
          onChange={(e) => set('categoryId', e.target.value)}
        >
          {data.categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Level"
          value={values.level}
          onChange={(e) => set('level', e.target.value as CourseLevel)}
        >
          <option value="undergraduate">Undergraduate</option>
          <option value="graduate">Graduate</option>
        </SelectField>
        <SelectField
          label="Status"
          value={values.status}
          hint="Drafts are hidden from students."
          onChange={(e) => set('status', e.target.value as CourseStatus)}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </SelectField>
        <TextField
          label="Credits"
          type="number"
          min={0}
          max={12}
          value={values.credits}
          onChange={(e) => set('credits', Number(e.target.value))}
        />
        <TextField
          label="Capacity"
          type="number"
          min={0}
          error={errors.capacity}
          value={values.capacity}
          onChange={(e) => set('capacity', Number(e.target.value))}
        />
        <TextField
          label="Enrolled"
          type="number"
          min={0}
          value={values.enrolled}
          onChange={(e) => set('enrolled', Number(e.target.value))}
        />
        <TextField
          label="Language"
          value={values.language}
          onChange={(e) => set('language', e.target.value)}
        />
        <TextField
          label="Location"
          placeholder="Engineering Hall, Room 201"
          className="field--full"
          value={values.location ?? ''}
          onChange={(e) => set('location', e.target.value)}
        />
      </section>

      <section className="field">
        <span className="field__label">Accent colour</span>
        <div className="chip-row">
          {COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`swatch${values.color === color ? ' is-selected' : ''}`}
              style={{ background: color }}
              aria-label={`Use ${color}`}
              aria-pressed={values.color === color}
              onClick={() => set('color', color)}
            />
          ))}
        </div>
      </section>

      <section className="field">
        <span className="field__label">Professors</span>
        {errors.professors && <span className="field__error">{errors.professors}</span>}
        <div className="chip-row">
          {professors.map((person) => (
            <button
              key={person.id}
              type="button"
              className={`person-chip${values.professorIds.includes(person.id) ? ' is-selected' : ''}`}
              onClick={() => toggleId('professorIds', person.id)}
              aria-pressed={values.professorIds.includes(person.id)}
            >
              <Avatar person={person} size="sm" />
              {person.name}
            </button>
          ))}
        </div>
      </section>

      <section className="field">
        <span className="field__label">Teaching assistants</span>
        <div className="chip-row">
          {tas.map((person) => (
            <button
              key={person.id}
              type="button"
              className={`person-chip${values.taIds.includes(person.id) ? ' is-selected' : ''}`}
              onClick={() => toggleId('taIds', person.id)}
              aria-pressed={values.taIds.includes(person.id)}
            >
              <Avatar person={person} size="sm" />
              {person.name}
            </button>
          ))}
        </div>
      </section>

      <TagPicker
        tags={data.tags}
        selected={values.tagIds}
        onChange={(ids) => set('tagIds', ids)}
        onCreate={(name, color) => addTag(name, color)}
      />

      <section className="field">
        <div className="row row--between">
          <span className="field__label">Meeting times</span>
          <Button
            size="sm"
            icon="plus"
            onClick={() =>
              set('meetingTimes', [
                ...values.meetingTimes,
                { day: 1, start: '09:00', end: '10:30', room: '' },
              ])
            }
          >
            Add slot
          </Button>
        </div>
        {values.meetingTimes.length === 0 ? (
          <p className="field__hint">No sessions scheduled yet.</p>
        ) : (
          <div className="stack--tight">
            {values.meetingTimes.map((meeting, index) => (
              <div key={index} className="repeater-row">
                <select
                  className="select"
                  value={meeting.day}
                  onChange={(e) => updateMeeting(index, { day: Number(e.target.value) })}
                  aria-label="Day"
                >
                  {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                    <option key={day} value={day}>
                      {dayShort(day)}
                    </option>
                  ))}
                </select>
                <input
                  className="input"
                  type="time"
                  value={meeting.start}
                  aria-label="Start time"
                  onChange={(e) => updateMeeting(index, { start: e.target.value })}
                />
                <input
                  className="input"
                  type="time"
                  value={meeting.end}
                  aria-label="End time"
                  onChange={(e) => updateMeeting(index, { end: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Room"
                  value={meeting.room ?? ''}
                  aria-label="Room"
                  onChange={(e) => updateMeeting(index, { room: e.target.value })}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  icon="trash"
                  iconOnly
                  aria-label="Remove slot"
                  onClick={() =>
                    set(
                      'meetingTimes',
                      values.meetingTimes.filter((_, i) => i !== index),
                    )
                  }
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="field-grid">
        <TextAreaField
          label="Prerequisites"
          hint="One per line."
          value={values.prerequisites.join('\n')}
          onChange={(e) =>
            set('prerequisites', e.target.value.split('\n').map((l) => l.trim()).filter(Boolean))
          }
        />
        <TextAreaField
          label="Learning objectives"
          hint="One per line."
          value={values.objectives.join('\n')}
          onChange={(e) =>
            set('objectives', e.target.value.split('\n').map((l) => l.trim()).filter(Boolean))
          }
        />
      </section>

      <section className="field">
        <div className="row row--between">
          <span className="field__label">
            Grading scheme{' '}
            <span className={weightTotal === 100 ? 'field__hint' : 'field__error'}>
              ({weightTotal}% allocated)
            </span>
          </span>
          <Button
            size="sm"
            icon="plus"
            onClick={() => set('gradingScheme', [...values.gradingScheme, { label: '', weight: 0 }])}
          >
            Add component
          </Button>
        </div>
        <div className="stack--tight">
          {values.gradingScheme.map((item, index) => (
            <div key={index} className="repeater-row repeater-row--grading">
              <input
                className="input"
                placeholder="Component (e.g. Final exam)"
                value={item.label}
                aria-label="Component"
                onChange={(e) =>
                  set(
                    'gradingScheme',
                    values.gradingScheme.map((g, i) =>
                      i === index ? { ...g, label: e.target.value } : g,
                    ),
                  )
                }
              />
              <input
                className="input"
                type="number"
                min={0}
                max={100}
                value={item.weight}
                aria-label="Weight"
                onChange={(e) =>
                  set(
                    'gradingScheme',
                    values.gradingScheme.map((g, i) =>
                      i === index ? { ...g, weight: Number(e.target.value) } : g,
                    ),
                  )
                }
              />
              <Button
                variant="ghost"
                size="sm"
                icon="trash"
                iconOnly
                aria-label="Remove component"
                onClick={() =>
                  set(
                    'gradingScheme',
                    values.gradingScheme.filter((_, i) => i !== index),
                  )
                }
              />
            </div>
          ))}
        </div>
      </section>

      {course && (
        <CheckboxField
          label="Keep this course visible in the archive only"
          hint="Archiving hides the course from the main list without deleting its content."
          checked={values.status === 'archived'}
          onChange={(e) => set('status', e.target.checked ? 'archived' : 'published')}
        />
      )}

      <p className="field__hint" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <Icon name="alert" size={13} /> Data is stored in this browser. Export it from Settings to keep a copy.
      </p>
    </Modal>
  )
}
