import type { AssignmentType, MaterialType } from '../types'
import type { IconName } from '../components/ui/Icon'

export const MATERIAL_TYPES: { value: MaterialType; label: string; plural: string; icon: IconName }[] = [
  { value: 'slides', label: 'Slides', plural: 'Slides', icon: 'slides' },
  { value: 'ebook', label: 'E-book', plural: 'E-books', icon: 'ebook' },
  { value: 'note', label: 'Notes', plural: 'Notes', icon: 'note' },
  { value: 'video', label: 'Video', plural: 'Videos', icon: 'video' },
  { value: 'paper', label: 'Paper', plural: 'Papers', icon: 'paper' },
  { value: 'dataset', label: 'Dataset', plural: 'Datasets', icon: 'dataset' },
  { value: 'code', label: 'Code', plural: 'Code', icon: 'code' },
  { value: 'link', label: 'Link', plural: 'Links', icon: 'link' },
]

export const materialIcon = (type: MaterialType): IconName =>
  MATERIAL_TYPES.find((t) => t.value === type)?.icon ?? 'note'

export const materialLabel = (type: MaterialType): string =>
  MATERIAL_TYPES.find((t) => t.value === type)?.label ?? type

/** Types that open in place rather than downloading. */
export const opensInPlace = (type: MaterialType) => type === 'link' || type === 'video'

export const ASSIGNMENT_TYPES: { value: AssignmentType; label: string; icon: IconName }[] = [
  { value: 'homework', label: 'Homework', icon: 'assignments' },
  { value: 'lab', label: 'Lab', icon: 'code' },
  { value: 'project', label: 'Project', icon: 'award' },
  { value: 'quiz', label: 'Quiz', icon: 'note' },
  { value: 'exam', label: 'Exam', icon: 'book' },
]

export const assignmentIcon = (type: AssignmentType): IconName =>
  ASSIGNMENT_TYPES.find((t) => t.value === type)?.icon ?? 'assignments'

export const assignmentLabel = (type: AssignmentType): string =>
  ASSIGNMENT_TYPES.find((t) => t.value === type)?.label ?? type
