import { useState } from 'react'
import type { Assignment, AssignmentType } from '../../types'
import { useData } from '../../store/DataProvider'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { CheckboxField, SelectField, TextAreaField, TextField } from '../ui/Field'
import { TagPicker } from '../ui/TagPicker'
import type { IconName } from '../ui/Icon'

export const ASSIGNMENT_TYPES: { value: AssignmentType; label: string; icon: IconName }[] = [
  { value: 'homework', label: 'Homework', icon: 'assignments' },
  { value: 'lab', label: 'Lab', icon: 'code' },
  { value: 'project', label: 'Project', icon: 'award' },
  { value: 'quiz', label: 'Quiz', icon: 'note' },
  { value: 'exam', label: 'Exam', icon: 'book' },
]

export const assignmentIcon = (type: AssignmentType): IconName =>
  ASSIGNMENT_TYPES.find((t) => t.value === type)?.icon ?? 'assignments'

/** <input type="datetime-local"> needs a local, second-less string. */
const toLocalInput = (iso: string) => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}

const fromLocalInput = (value: string) =>
  value ? new Date(value).toISOString() : new Date().toISOString()

type Values = Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>

export function AssignmentForm({
  open,
  assignment,
  courseId,
  authorId,
  onClose,
  onSubmit,
}: {
  open: boolean
  assignment?: Assignment
  courseId?: string
  authorId: string
  onClose: () => void
  onSubmit: (values: Values) => void
}) {
  const { data, addTag } = useData()
  const activeCourses = data.courses.filter((c) => c.status !== 'archived')
  const [values, setValues] = useState<Values>(() => {
    if (assignment) return assignment
    const due = new Date()
    due.setDate(due.getDate() + 7)
    due.setHours(23, 59, 0, 0)
    return {
      courseId: courseId ?? activeCourses[0]?.id ?? '',
      title: '',
      description: '',
      type: 'homework',
      dueDate: due.toISOString(),
      releaseDate: new Date().toISOString(),
      points: 100,
      weight: 10,
      attachmentUrl: '',
      allowLate: true,
      published: false,
      submissions: 0,
      graded: 0,
      authorId,
      tagIds: [],
    }
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = <K extends keyof Values>(key: K, value: Values[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }))

  const submit = () => {
    const nextErrors: Record<string, string> = {}
    if (!values.title.trim()) nextErrors.title = 'A title is required.'
    if (!values.courseId) nextErrors.courseId = 'Pick a course.'
    if (new Date(values.dueDate) <= new Date(values.releaseDate))
      nextErrors.dueDate = 'The deadline must come after the release date.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    onSubmit({ ...values, title: values.title.trim() })
  }

  return (
    <Modal
      open={open}
      title={assignment ? 'Edit assignment' : 'New assignment'}
      description="Homework, labs, quizzes, projects, and exams share one schedule."
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>
            {assignment ? 'Save assignment' : 'Create assignment'}
          </Button>
        </>
      }
    >
      <TextField
        label="Title"
        placeholder="Homework 3 — Virtual memory"
        value={values.title}
        error={errors.title}
        onChange={(e) => set('title', e.target.value)}
      />

      <div className="field-grid">
        <SelectField
          label="Type"
          value={values.type}
          onChange={(e) => set('type', e.target.value as AssignmentType)}
        >
          {ASSIGNMENT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Course"
          value={values.courseId}
          error={errors.courseId}
          disabled={Boolean(courseId)}
          onChange={(e) => set('courseId', e.target.value)}
        >
          {activeCourses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.code} — {course.title}
            </option>
          ))}
        </SelectField>
        <TextField
          label="Released"
          type="datetime-local"
          value={toLocalInput(values.releaseDate)}
          onChange={(e) => set('releaseDate', fromLocalInput(e.target.value))}
        />
        <TextField
          label="Due"
          type="datetime-local"
          error={errors.dueDate}
          value={toLocalInput(values.dueDate)}
          onChange={(e) => set('dueDate', fromLocalInput(e.target.value))}
        />
        <TextField
          label="Points"
          type="number"
          min={0}
          value={values.points}
          onChange={(e) => set('points', Number(e.target.value))}
        />
        <TextField
          label="Weight (% of final grade)"
          type="number"
          min={0}
          max={100}
          value={values.weight}
          onChange={(e) => set('weight', Number(e.target.value))}
        />
      </div>

      <TextAreaField
        label="Instructions"
        value={values.description}
        onChange={(e) => set('description', e.target.value)}
      />

      <TextField
        label="Attachment URL"
        placeholder="https://files.university.edu/…"
        value={values.attachmentUrl ?? ''}
        onChange={(e) => set('attachmentUrl', e.target.value)}
      />

      <TagPicker
        tags={data.tags}
        selected={values.tagIds}
        onChange={(ids) => set('tagIds', ids)}
        onCreate={(name, color) => addTag(name, color)}
      />

      <div className="field-grid">
        <CheckboxField
          label="Published"
          hint="Unpublished assignments are invisible to students."
          checked={values.published}
          onChange={(e) => set('published', e.target.checked)}
        />
        <CheckboxField
          label="Accept late submissions"
          hint="Late work is flagged but still collected."
          checked={values.allowLate}
          onChange={(e) => set('allowLate', e.target.checked)}
        />
      </div>
    </Modal>
  )
}
