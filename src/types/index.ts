/** Domain model for the course management app. */

export type Role = 'professor' | 'ta' | 'student'

export interface Person {
  id: string
  name: string
  email: string
  role: Role
  title?: string
  department?: string
  office?: string
  officeHours?: string
  phone?: string
  bio?: string
  avatarColor: string
  website?: string
}

export type SemesterTerm = 'Fall' | 'Spring' | 'Summer' | 'Winter'

export interface Semester {
  id: string
  term: SemesterTerm
  year: number
  startDate: string
  endDate: string
  /** The semester currently in session. Exactly one should be true. */
  current: boolean
}

export interface Category {
  id: string
  name: string
  description?: string
  color: string
}

export interface Tag {
  id: string
  name: string
  color: string
}

export type CourseStatus = 'draft' | 'published' | 'archived'
export type CourseLevel = 'undergraduate' | 'graduate'

export interface MeetingTime {
  /** 0 = Sunday … 6 = Saturday */
  day: number
  start: string
  end: string
  room?: string
}

export interface Course {
  id: string
  code: string
  title: string
  summary: string
  description: string
  semesterId: string
  categoryId: string
  tagIds: string[]
  /** Lead instructors, expected to be people with the `professor` role. */
  professorIds: string[]
  /** Teaching assistants supporting the course. */
  taIds: string[]
  status: CourseStatus
  level: CourseLevel
  credits: number
  capacity: number
  enrolled: number
  language: string
  color: string
  location?: string
  meetingTimes: MeetingTime[]
  prerequisites: string[]
  objectives: string[]
  gradingScheme: { label: string; weight: number }[]
  createdAt: string
  updatedAt: string
  archivedAt?: string
}

export type MaterialType =
  | 'slides'
  | 'ebook'
  | 'note'
  | 'video'
  | 'link'
  | 'dataset'
  | 'code'
  | 'paper'

export interface Material {
  id: string
  courseId: string
  moduleId?: string
  title: string
  description?: string
  type: MaterialType
  url: string
  /** Size in bytes; 0 for links and streamed resources. */
  sizeBytes: number
  tagIds: string[]
  week?: number
  authorId: string
  visible: boolean
  downloads: number
  createdAt: string
  updatedAt: string
}

export interface Module {
  id: string
  courseId: string
  title: string
  summary?: string
  order: number
}

export type AssignmentType = 'homework' | 'quiz' | 'project' | 'exam' | 'lab'

export interface Assignment {
  id: string
  courseId: string
  title: string
  description: string
  type: AssignmentType
  dueDate: string
  releaseDate: string
  points: number
  weight: number
  attachmentUrl?: string
  allowLate: boolean
  published: boolean
  submissions: number
  graded: number
  authorId: string
  tagIds: string[]
  createdAt: string
  updatedAt: string
}

export interface Announcement {
  id: string
  courseId: string
  title: string
  body: string
  authorId: string
  pinned: boolean
  createdAt: string
}

export interface AppData {
  people: Person[]
  semesters: Semester[]
  categories: Category[]
  tags: Tag[]
  courses: Course[]
  modules: Module[]
  materials: Material[]
  assignments: Assignment[]
  announcements: Announcement[]
}

export interface CourseFilters {
  query: string
  semesterId: string
  categoryId: string
  tagIds: string[]
  instructorId: string
  level: string
  status: CourseStatus | 'all'
  sort: 'recent' | 'code' | 'title' | 'enrollment'
}
