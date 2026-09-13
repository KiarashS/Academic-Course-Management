import { useState } from 'react'
import type { Material, MaterialType } from '../../types'
import { useData } from '../../store/DataProvider'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { CheckboxField, SelectField, TextAreaField, TextField } from '../ui/Field'
import { TagPicker } from '../ui/TagPicker'
import type { IconName } from '../ui/Icon'

export const MATERIAL_TYPES: { value: MaterialType; label: string; icon: IconName }[] = [
  { value: 'slides', label: 'Slides', icon: 'slides' },
  { value: 'ebook', label: 'E-book', icon: 'ebook' },
  { value: 'note', label: 'Notes / handout', icon: 'note' },
  { value: 'video', label: 'Video', icon: 'video' },
  { value: 'paper', label: 'Paper', icon: 'paper' },
  { value: 'dataset', label: 'Dataset', icon: 'dataset' },
  { value: 'code', label: 'Code', icon: 'code' },
  { value: 'link', label: 'External link', icon: 'link' },
]

export const materialIcon = (type: MaterialType): IconName =>
  MATERIAL_TYPES.find((t) => t.value === type)?.icon ?? 'note'

export const materialLabel = (type: MaterialType) =>
  MATERIAL_TYPES.find((t) => t.value === type)?.label ?? type

type Values = Omit<Material, 'id' | 'createdAt' | 'updatedAt'>

export function MaterialForm({
  open,
  material,
  courseId,
  authorId,
  onClose,
  onSubmit,
}: {
  open: boolean
  material?: Material
  courseId?: string
  authorId: string
  onClose: () => void
  onSubmit: (values: Values) => void
}) {
  const { data, addTag } = useData()
  const activeCourses = data.courses.filter((c) => c.status !== 'archived')
  const [values, setValues] = useState<Values>(
    () =>
      material ?? {
        courseId: courseId ?? activeCourses[0]?.id ?? '',
        moduleId: undefined,
        title: '',
        description: '',
        type: 'slides',
        url: '',
        sizeBytes: 0,
        tagIds: [],
        week: undefined,
        authorId,
        visible: true,
        downloads: 0,
      },
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sizeMb, setSizeMb] = useState(() =>
    material?.sizeBytes ? (material.sizeBytes / 1024 / 1024).toFixed(1) : '',
  )

  const set = <K extends keyof Values>(key: K, value: Values[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }))

  const modules = data.modules
    .filter((m) => m.courseId === values.courseId)
    .sort((a, b) => a.order - b.order)

  const submit = () => {
    const nextErrors: Record<string, string> = {}
    if (!values.title.trim()) nextErrors.title = 'A title is required.'
    if (!values.url.trim()) nextErrors.url = 'A file URL or link is required.'
    if (!values.courseId) nextErrors.courseId = 'Pick a course.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    onSubmit({
      ...values,
      title: values.title.trim(),
      url: values.url.trim(),
      sizeBytes: sizeMb ? Math.round(Number(sizeMb) * 1024 * 1024) : 0,
    })
  }

  return (
    <Modal
      open={open}
      title={material ? 'Edit material' : 'Add material'}
      description="Slides, e-books, recordings, datasets, and links all live in the same library."
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>
            {material ? 'Save material' : 'Add material'}
          </Button>
        </>
      }
    >
      <TextField
        label="Title"
        placeholder="Lecture 4 — CPU scheduling"
        value={values.title}
        error={errors.title}
        onChange={(e) => set('title', e.target.value)}
      />

      <div className="field-grid">
        <SelectField
          label="Type"
          value={values.type}
          onChange={(e) => set('type', e.target.value as MaterialType)}
        >
          {MATERIAL_TYPES.map((type) => (
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
        <SelectField
          label="Module"
          value={values.moduleId ?? ''}
          hint="Optional grouping inside the course."
          onChange={(e) => set('moduleId', e.target.value || undefined)}
        >
          <option value="">Unassigned</option>
          {modules.map((module) => (
            <option key={module.id} value={module.id}>
              {module.title}
            </option>
          ))}
        </SelectField>
        <TextField
          label="Week"
          type="number"
          min={1}
          max={20}
          placeholder="e.g. 3"
          value={values.week ?? ''}
          onChange={(e) => set('week', e.target.value ? Number(e.target.value) : undefined)}
        />
      </div>

      <TextField
        label="File URL or link"
        placeholder="https://files.university.edu/…"
        value={values.url}
        error={errors.url}
        onChange={(e) => set('url', e.target.value)}
      />

      <div className="field-grid">
        <TextField
          label="Size (MB)"
          type="number"
          min={0}
          step="0.1"
          hint="Leave empty for streamed or linked resources."
          value={sizeMb}
          onChange={(e) => setSizeMb(e.target.value)}
        />
        <SelectField
          label="Uploaded by"
          value={values.authorId}
          onChange={(e) => set('authorId', e.target.value)}
        >
          {data.people
            .filter((p) => p.role !== 'student')
            .map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
        </SelectField>
      </div>

      <TextAreaField
        label="Description"
        style={{ minHeight: 72 }}
        value={values.description ?? ''}
        onChange={(e) => set('description', e.target.value)}
      />

      <TagPicker
        tags={data.tags}
        selected={values.tagIds}
        onChange={(ids) => set('tagIds', ids)}
        onCreate={(name, color) => addTag(name, color)}
      />

      <CheckboxField
        label="Visible to students"
        hint="Hidden items stay in the library for staff only."
        checked={values.visible}
        onChange={(e) => set('visible', e.target.checked)}
      />
    </Modal>
  )
}
