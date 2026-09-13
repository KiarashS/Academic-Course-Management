/** The shape of content/courses.yaml, before it is expanded into AppData. */

export interface RawSemester {
  id: string
  term: string
  year: number
  start: string
  end: string
  current?: boolean
}

export interface RawNamed {
  id: string
  name: string
  color?: string
  description?: string
}

export interface RawPerson {
  id: string
  name: string
  email?: string
  role?: string
  title?: string
  department?: string
  office?: string
  officeHours?: string
  phone?: string
  website?: string
  bio?: string
  color?: string
}

export interface RawMeeting {
  day: string | number
  start: string
  end: string
  room?: string
}

export interface RawModule {
  id: string
  title: string
  summary?: string
}

export interface RawMaterial {
  title: string
  type?: string
  /** Path inside the course folder under public/courses/<folder>/. */
  file?: string
  /** An external address, used instead of `file`. */
  url?: string
  module?: string
  week?: number
  author?: string
  tags?: string[]
  description?: string
  added?: string
  visible?: boolean
  downloads?: number
  /** Overrides the size read from disk, e.g. "4.2 MB". */
  size?: string | number
}

export interface RawAssignment {
  title: string
  type?: string
  description?: string
  released?: string
  due: string
  points?: number
  weight?: number
  author?: string
  tags?: string[]
  attachment?: string
  allowLate?: boolean
  published?: boolean
  submissions?: number
  graded?: number
}

export interface RawAnnouncement {
  title: string
  body: string
  author?: string
  date?: string
  pinned?: boolean
}

export interface RawCourse {
  id: string
  code: string
  title: string
  semester: string
  category?: string
  status?: string
  level?: string
  credits?: number
  capacity?: number
  enrolled?: number
  color?: string
  location?: string
  language?: string
  /** Folder under public/courses/. Defaults to the course id. */
  folder?: string
  professors?: string[]
  assistants?: string[]
  tags?: string[]
  summary?: string
  description?: string
  prerequisites?: string[]
  objectives?: string[]
  schedule?: RawMeeting[]
  grading?: { label: string; weight: number }[]
  modules?: RawModule[]
  materials?: RawMaterial[]
  assignments?: RawAssignment[]
  announcements?: RawAnnouncement[]
  created?: string
  updated?: string
  archived?: string
}

export interface RawContent {
  site?: { name?: string; tagline?: string }
  semesters?: RawSemester[]
  categories?: RawNamed[]
  tags?: RawNamed[]
  people?: RawPerson[]
  courses?: RawCourse[]
}
