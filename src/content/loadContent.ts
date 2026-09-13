import type {
  Announcement,
  AppData,
  Assignment,
  AssignmentType,
  Category,
  Course,
  CourseLevel,
  CourseStatus,
  Material,
  MaterialType,
  MeetingTime,
  Module,
  Person,
  Role,
  Semester,
  SemesterTerm,
  Tag,
} from '../types'
import type { RawContent, RawCourse, RawMaterial } from './types'
import rawContent from '../../content/courses.yaml'
import fileSizes from 'virtual:course-files'
import { slugify } from '../lib/format'

export class ContentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ContentError'
  }
}

const FALLBACK_COLOR = '#6366f1'

const PALETTE = [
  '#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899',
  '#8b5cf6', '#f43f5e', '#14b8a6', '#a855f7', '#64748b',
]

const DAYS: Record<string, number> = {
  sun: 0, sunday: 0,
  mon: 1, monday: 1,
  tue: 2, tues: 2, tuesday: 2,
  wed: 3, weds: 3, wednesday: 3,
  thu: 4, thur: 4, thurs: 4, thursday: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6,
}

const MATERIAL_TYPES: MaterialType[] = [
  'slides', 'ebook', 'note', 'video', 'link', 'dataset', 'code', 'paper',
]

const ASSIGNMENT_TYPES: AssignmentType[] = ['homework', 'quiz', 'project', 'exam', 'lab']

const TERMS: SemesterTerm[] = ['Fall', 'Spring', 'Summer', 'Winter']

/** Extensions that imply a material type, so `type:` can usually be omitted. */
const TYPE_BY_EXTENSION: Record<string, MaterialType> = {
  pdf: 'note', ppt: 'slides', pptx: 'slides', key: 'slides',
  epub: 'ebook', mobi: 'ebook', djvu: 'ebook',
  mp4: 'video', mov: 'video', mkv: 'video', webm: 'video',
  csv: 'dataset', tsv: 'dataset', json: 'dataset', parquet: 'dataset', xlsx: 'dataset',
  zip: 'code', tar: 'code', gz: 'code', py: 'code', ipynb: 'code', c: 'code', go: 'code',
  md: 'note', txt: 'note', doc: 'note', docx: 'note',
}

/**
 * Reads "2026-09-07" and "2026-09-07 23:59" as local time. YAML timestamps are
 * deliberately kept as strings (CORE_SCHEMA) so a deadline written as 23:59
 * means 23:59 where the reader is, not UTC.
 */
function parseDate(value: string | undefined, where: string, fallback?: string): string {
  if (value === undefined || value === null || value === '') {
    if (fallback !== undefined) return fallback
    throw new ContentError(`${where}: a date is required.`)
  }
  const text = String(value).trim()
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/.exec(text)
  if (!match) {
    const parsed = new Date(text)
    if (Number.isNaN(parsed.getTime()))
      throw new ContentError(`${where}: "${text}" is not a date. Use YYYY-MM-DD or YYYY-MM-DD HH:mm.`)
    return parsed.toISOString()
  }
  const [, year, month, day, hour, minute] = match
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    hour ? Number(hour) : 0,
    minute ? Number(minute) : 0,
  ).toISOString()
}

/** Accepts "4.2 MB", "512kb", or a plain byte count. */
function parseSize(value: string | number | undefined): number | undefined {
  if (value === undefined) return undefined
  if (typeof value === 'number') return Math.round(value)
  const match = /^([\d.]+)\s*(b|kb|mb|gb)?$/i.exec(value.trim())
  if (!match) return undefined
  const factor = { b: 1, kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3 }[
    (match[2] ?? 'b').toLowerCase() as 'b' | 'kb' | 'mb' | 'gb'
  ]
  return Math.round(Number(match[1]) * factor)
}

const pickColor = (given: string | undefined, index: number) =>
  given ?? PALETTE[index % PALETTE.length]

function oneOf<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  fallback: T,
  where: string,
): T {
  if (value === undefined) return fallback
  const match = allowed.find((item) => item.toLowerCase() === String(value).toLowerCase())
  if (!match)
    throw new ContentError(
      `${where}: "${value}" is not valid. Use one of: ${allowed.join(', ')}.`,
    )
  return match
}

function requireRef(id: string, known: Set<string>, where: string, kind: string): string {
  if (id === undefined || id === null || id === '')
    throw new ContentError(`${where}: a ${kind} id is required.`)
  if (!known.has(id))
    throw new ContentError(
      `${where}: no ${kind} with id "${id}" is defined in this file. ` +
        `Known ${kind}s: ${[...known].join(', ') || '(none)'}.`,
    )
  return id
}

function materialType(raw: RawMaterial, where: string): MaterialType {
  if (raw.type) return oneOf(raw.type, MATERIAL_TYPES, 'note', `${where} type`)
  if (raw.file) {
    const extension = raw.file.split('.').pop()?.toLowerCase() ?? ''
    if (TYPE_BY_EXTENSION[extension]) return TYPE_BY_EXTENSION[extension]
  }
  return raw.url ? 'link' : 'note'
}

/** Where a course's files live, both on disk and in the deployed site. */
export const courseFolder = (course: RawCourse) => course.folder ?? course.id

/** public/courses/<folder>/<file> resolved against the deployed base path. */
export function resolveFileUrl(folder: string, file: string): string {
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`
  return `${base}courses/${folder}/${file.replace(/^\/+/, '')}`
}

/** A short, stable hash so a changed YAML file invalidates a stored draft. */
function fingerprint(value: unknown): string {
  const text = JSON.stringify(value)
  let hash = 2166136261
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

export interface LoadedContent {
  data: AppData
  site: { name: string; tagline: string }
  fingerprint: string
  /** Files referenced by the YAML that are not present under public/courses. */
  missingFiles: string[]
}

export function buildContent(raw: RawContent): LoadedContent {
  const semesters: Semester[] = (raw.semesters ?? []).map((item, index) => {
    if (!item.id) throw new ContentError(`semesters[${index}]: an id is required.`)
    return {
      id: item.id,
      term: oneOf(item.term, TERMS, 'Fall', `semester "${item.id}" term`),
      year: Number(item.year) || new Date(parseDate(item.start, `semester "${item.id}"`)).getFullYear(),
      startDate: parseDate(item.start, `semester "${item.id}" start`),
      endDate: parseDate(item.end, `semester "${item.id}" end`),
      current: Boolean(item.current),
    }
  })
  if (semesters.length === 0) throw new ContentError('At least one semester must be defined.')
  if (!semesters.some((s) => s.current)) semesters[0].current = true

  const categories: Category[] = (raw.categories ?? []).map((item, index) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    color: pickColor(item.color, index),
  }))

  const tags: Tag[] = (raw.tags ?? []).map((item, index) => ({
    id: item.id,
    name: item.name ?? item.id,
    color: pickColor(item.color, index + 3),
  }))

  const people: Person[] = (raw.people ?? []).map((item, index) => {
    if (!item.id) throw new ContentError(`people[${index}]: an id is required.`)
    return {
      id: item.id,
      name: item.name ?? item.id,
      email: item.email ?? '',
      role: oneOf(item.role, ['professor', 'ta', 'student'] as Role[], 'professor', `person "${item.id}" role`),
      title: item.title,
      department: item.department,
      office: item.office,
      officeHours: item.officeHours,
      phone: item.phone,
      bio: item.bio,
      website: item.website,
      avatarColor: pickColor(item.color, index),
    }
  })

  const semesterIds = new Set(semesters.map((s) => s.id))
  const categoryIds = new Set(categories.map((c) => c.id))
  const tagIds = new Set(tags.map((t) => t.id))
  const peopleIds = new Set(people.map((p) => p.id))

  const courses: Course[] = []
  const modules: Module[] = []
  const materials: Material[] = []
  const assignments: Assignment[] = []
  const announcements: Announcement[] = []
  const missingFiles: string[] = []
  const seenCourseIds = new Set<string>()

  for (const [index, raw_] of (raw.courses ?? []).entries()) {
    const where = `courses[${index}]${raw_.id ? ` ("${raw_.id}")` : ''}`
    if (!raw_.id) throw new ContentError(`${where}: an id is required — it is the URL and the folder name.`)
    if (seenCourseIds.has(raw_.id)) throw new ContentError(`${where}: duplicate course id.`)
    seenCourseIds.add(raw_.id)

    const folder = courseFolder(raw_)
    const courseTags = (raw_.tags ?? []).map((id) => requireRef(id, tagIds, `${where} tags`, 'tag'))
    const professors = (raw_.professors ?? []).map((id) =>
      requireRef(id, peopleIds, `${where} professors`, 'person'),
    )
    const assistants = (raw_.assistants ?? []).map((id) =>
      requireRef(id, peopleIds, `${where} assistants`, 'person'),
    )
    const defaultAuthor = professors[0] ?? assistants[0] ?? people[0]?.id ?? ''

    const status = oneOf(
      raw_.status,
      ['draft', 'published', 'archived'] as CourseStatus[],
      'published',
      `${where} status`,
    )

    const semesterId = requireRef(raw_.semester, semesterIds, `${where} semester`, 'semester')
    const created = parseDate(
      raw_.created,
      where,
      semesters.find((s) => s.id === semesterId)?.startDate,
    )
    const moduleIds = new Set<string>()
    for (const module of raw_.modules ?? []) {
      if (!module.id) throw new ContentError(`${where} modules: an id is required.`)
      moduleIds.add(module.id)
      modules.push({
        id: `${raw_.id}--${module.id}`,
        courseId: raw_.id,
        title: module.title ?? module.id,
        summary: module.summary,
        order: modules.filter((m) => m.courseId === raw_.id).length + 1,
      })
    }

    let newest = created
    const usedIds = new Set<string>()
    const uniqueId = (prefix: string, title: string) => {
      const base = `${raw_.id}--${slugify(title) || prefix}`
      let id = base
      let n = 2
      while (usedIds.has(id)) id = `${base}-${n++}`
      usedIds.add(id)
      return id
    }

    for (const material of raw_.materials ?? []) {
      const at = `${where} material "${material.title}"`
      if (!material.title) throw new ContentError(`${where}: every material needs a title.`)
      if (!material.file && !material.url)
        throw new ContentError(`${at}: needs either a "file" (under public/courses/${folder}/) or a "url".`)

      let url: string
      let sizeBytes = parseSize(material.size) ?? 0
      if (material.file) {
        const relative = `${folder}/${material.file.replace(/^\/+/, '')}`
        url = resolveFileUrl(folder, material.file)
        const onDisk = fileSizes[relative]
        if (onDisk === undefined) missingFiles.push(relative)
        else if (!material.size) sizeBytes = onDisk
      } else {
        url = material.url!
      }

      const added = parseDate(material.added, at, created)
      if (added > newest) newest = added
      materials.push({
        id: uniqueId('material', material.title),
        courseId: raw_.id,
        moduleId: material.module
          ? `${raw_.id}--${requireRef(material.module, moduleIds, at, 'module')}`
          : undefined,
        title: material.title,
        description: material.description,
        type: materialType(material, at),
        url,
        sizeBytes,
        tagIds: (material.tags ?? []).map((id) => requireRef(id, tagIds, `${at} tags`, 'tag')),
        week: material.week,
        authorId: material.author
          ? requireRef(material.author, peopleIds, `${at} author`, 'person')
          : defaultAuthor,
        visible: material.visible !== false,
        downloads: material.downloads ?? 0,
        createdAt: added,
        updatedAt: added,
      })
    }

    for (const assignment of raw_.assignments ?? []) {
      const at = `${where} assignment "${assignment.title}"`
      if (!assignment.title) throw new ContentError(`${where}: every assignment needs a title.`)
      const released = parseDate(assignment.released, at, created)
      const due = parseDate(assignment.due, `${at} due`)
      if (due <= released)
        throw new ContentError(`${at}: "due" (${assignment.due}) must come after "released".`)
      if (due > newest) newest = due
      assignments.push({
        id: uniqueId('assignment', assignment.title),
        courseId: raw_.id,
        title: assignment.title,
        description: assignment.description ?? '',
        type: oneOf(assignment.type, ASSIGNMENT_TYPES, 'homework', `${at} type`),
        dueDate: due,
        releaseDate: released,
        points: assignment.points ?? 100,
        weight: assignment.weight ?? 0,
        attachmentUrl: assignment.attachment
          ? /^https?:/.test(assignment.attachment)
            ? assignment.attachment
            : resolveFileUrl(folder, assignment.attachment)
          : undefined,
        allowLate: assignment.allowLate !== false,
        published: assignment.published !== false,
        submissions: assignment.submissions ?? 0,
        graded: assignment.graded ?? 0,
        authorId: assignment.author
          ? requireRef(assignment.author, peopleIds, `${at} author`, 'person')
          : defaultAuthor,
        tagIds: (assignment.tags ?? []).map((id) => requireRef(id, tagIds, `${at} tags`, 'tag')),
        createdAt: released,
        updatedAt: released,
      })
      if (assignment.attachment && !/^https?:/.test(assignment.attachment)) {
        const relative = `${folder}/${assignment.attachment.replace(/^\/+/, '')}`
        if (fileSizes[relative] === undefined) missingFiles.push(relative)
      }
    }

    for (const announcement of raw_.announcements ?? []) {
      const at = `${where} announcement "${announcement.title}"`
      const date = parseDate(announcement.date, at, created)
      if (date > newest) newest = date
      announcements.push({
        id: uniqueId('announcement', announcement.title),
        courseId: raw_.id,
        title: announcement.title,
        body: announcement.body ?? '',
        authorId: announcement.author
          ? requireRef(announcement.author, peopleIds, `${at} author`, 'person')
          : defaultAuthor,
        pinned: Boolean(announcement.pinned),
        createdAt: date,
      })
    }

    const meetingTimes: MeetingTime[] = (raw_.schedule ?? []).map((meeting) => {
      const day =
        typeof meeting.day === 'number'
          ? meeting.day
          : DAYS[String(meeting.day).trim().toLowerCase()]
      if (day === undefined)
        throw new ContentError(`${where} schedule: "${meeting.day}" is not a weekday.`)
      return { day, start: String(meeting.start), end: String(meeting.end), room: meeting.room }
    })

    courses.push({
      id: raw_.id,
      code: raw_.code ?? raw_.id.toUpperCase(),
      title: raw_.title ?? raw_.id,
      summary: raw_.summary ?? '',
      description: raw_.description ?? raw_.summary ?? '',
      semesterId,
      categoryId: raw_.category
        ? requireRef(raw_.category, categoryIds, `${where} category`, 'category')
        : (categories[0]?.id ?? ''),
      tagIds: courseTags,
      professorIds: professors,
      taIds: assistants,
      status,
      level: oneOf(raw_.level, ['undergraduate', 'graduate'] as CourseLevel[], 'undergraduate', `${where} level`),
      credits: raw_.credits ?? 3,
      capacity: raw_.capacity ?? 0,
      enrolled: raw_.enrolled ?? 0,
      language: raw_.language ?? 'English',
      color: raw_.color ?? PALETTE[index % PALETTE.length] ?? FALLBACK_COLOR,
      location: raw_.location,
      meetingTimes,
      prerequisites: raw_.prerequisites ?? [],
      objectives: raw_.objectives ?? [],
      gradingScheme: raw_.grading ?? [],
      createdAt: created,
      updatedAt: parseDate(raw_.updated, where, newest),
      archivedAt: raw_.archived ? parseDate(raw_.archived, `${where} archived`) : undefined,
    })
  }

  return {
    data: { people, semesters, categories, tags, courses, modules, materials, assignments, announcements },
    site: {
      name: raw.site?.name ?? 'Course Hub',
      tagline: raw.site?.tagline ?? 'Course workspace',
    },
    fingerprint: fingerprint(raw),
    missingFiles: [...new Set(missingFiles)].sort(),
  }
}

const EMPTY: LoadedContent = {
  data: {
    people: [],
    semesters: [],
    categories: [],
    tags: [],
    courses: [],
    modules: [],
    materials: [],
    assignments: [],
    announcements: [],
  },
  site: { name: 'Course Hub', tagline: 'Course workspace' },
  fingerprint: 'invalid',
  missingFiles: [],
}

/**
 * A bad content file should say what is wrong rather than blank the page, so
 * the failure is carried rather than thrown and the app renders an error screen.
 */
function parseContentFile(): { content: LoadedContent; error: Error | null } {
  try {
    return { content: buildContent(rawContent as RawContent), error: null }
  } catch (error) {
    return { content: EMPTY, error: error as Error }
  }
}

const parsed = parseContentFile()

/** The parsed content file, or an empty workspace when it could not be read. */
export const content: LoadedContent = parsed.content

/** Set when content/courses.yaml could not be understood. */
export const contentError: Error | null = parsed.error
