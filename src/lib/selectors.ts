import type {
  AppData,
  Assignment,
  Course,
  CourseFilters,
  Material,
  Person,
  Semester,
  Tag,
} from '../types'

export const byId = <T extends { id: string }>(items: T[], id: string | undefined) =>
  id ? items.find((item) => item.id === id) : undefined

export const tagsFor = (tags: Tag[], ids: string[]) =>
  ids.map((id) => tags.find((t) => t.id === id)).filter((t): t is Tag => Boolean(t))

export const peopleFor = (people: Person[], ids: string[]) =>
  ids.map((id) => people.find((p) => p.id === id)).filter((p): p is Person => Boolean(p))

export const semesterLabel = (semester: Semester | undefined) =>
  semester ? `${semester.term} ${semester.year}` : 'Unassigned'

export function courseInstructors(data: AppData, course: Course) {
  return {
    professors: peopleFor(data.people, course.professorIds),
    tas: peopleFor(data.people, course.taIds),
  }
}

export interface CourseStats {
  materials: number
  assignments: number
  openAssignments: number
  announcements: number
  downloads: number
}

export function courseStats(data: AppData, courseId: string): CourseStats {
  const materials = data.materials.filter((m) => m.courseId === courseId)
  const assignments = data.assignments.filter((a) => a.courseId === courseId)
  return {
    materials: materials.length,
    assignments: assignments.length,
    openAssignments: assignments.filter(
      (a) => a.published && new Date(a.dueDate).getTime() > Date.now(),
    ).length,
    announcements: data.announcements.filter((a) => a.courseId === courseId).length,
    downloads: materials.reduce((sum, m) => sum + m.downloads, 0),
  }
}

const matches = (haystack: (string | undefined)[], needle: string) =>
  haystack.filter(Boolean).join(' ').toLowerCase().includes(needle)

export function filterCourses(data: AppData, filters: CourseFilters): Course[] {
  const query = filters.query.trim().toLowerCase()
  const result = data.courses.filter((course) => {
    if (filters.status === 'all') {
      // "All" still hides the archive; the archive has its own page.
      if (course.status === 'archived') return false
    } else if (course.status !== filters.status) {
      return false
    }
    if (filters.semesterId && course.semesterId !== filters.semesterId) return false
    if (filters.categoryId && course.categoryId !== filters.categoryId) return false
    if (filters.level && course.level !== filters.level) return false
    if (
      filters.instructorId &&
      !course.professorIds.includes(filters.instructorId) &&
      !course.taIds.includes(filters.instructorId)
    )
      return false
    if (filters.tagIds.length && !filters.tagIds.every((id) => course.tagIds.includes(id)))
      return false
    if (query) {
      const tagNames = tagsFor(data.tags, course.tagIds).map((t) => t.name)
      const instructors = peopleFor(data.people, [
        ...course.professorIds,
        ...course.taIds,
      ]).map((p) => p.name)
      if (
        !matches(
          [course.code, course.title, course.summary, course.description, ...tagNames, ...instructors],
          query,
        )
      )
        return false
    }
    return true
  })

  const sorted = [...result]
  switch (filters.sort) {
    case 'code':
      sorted.sort((a, b) => a.code.localeCompare(b.code))
      break
    case 'title':
      sorted.sort((a, b) => a.title.localeCompare(b.title))
      break
    case 'enrollment':
      sorted.sort((a, b) => b.enrolled - a.enrolled)
      break
    default:
      sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }
  return sorted
}

export const defaultCourseFilters: CourseFilters = {
  query: '',
  semesterId: '',
  categoryId: '',
  tagIds: [],
  instructorId: '',
  level: '',
  status: 'all',
  sort: 'recent',
}

export function upcomingAssignments(data: AppData, limit = 6, courseIds?: string[]): Assignment[] {
  const nowMs = Date.now()
  return data.assignments
    .filter((a) => a.published && new Date(a.dueDate).getTime() >= nowMs)
    .filter((a) => !courseIds || courseIds.includes(a.courseId))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, limit)
}

export function recentMaterials(data: AppData, limit = 6, courseIds?: string[]): Material[] {
  return data.materials
    .filter((m) => !courseIds || courseIds.includes(m.courseId))
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
}

export type SearchKind = 'course' | 'material' | 'assignment' | 'person'

export interface SearchResult {
  id: string
  kind: SearchKind
  title: string
  subtitle: string
  href: string
  meta?: string
}

/** One ranked list across every entity, used by the search page and the ⌘K palette. */
export function globalSearch(data: AppData, rawQuery: string, limit = 40): SearchResult[] {
  const query = rawQuery.trim().toLowerCase()
  if (!query) return []
  const results: (SearchResult & { score: number })[] = []

  const score = (primary: string, secondary: (string | undefined)[]) => {
    const p = primary.toLowerCase()
    if (p === query) return 100
    if (p.startsWith(query)) return 80
    if (p.includes(query)) return 60
    if (secondary.some((s) => s?.toLowerCase().includes(query))) return 30
    return 0
  }

  for (const course of data.courses) {
    const tagNames = tagsFor(data.tags, course.tagIds).map((t) => t.name)
    const s = Math.max(
      score(course.code, []),
      score(course.title, [course.summary, course.description, ...tagNames]),
    )
    if (s > 0)
      results.push({
        score: s,
        id: course.id,
        kind: 'course',
        title: `${course.code} · ${course.title}`,
        subtitle: course.summary,
        meta: semesterLabel(byId(data.semesters, course.semesterId)),
        href: `/courses/${course.id}`,
      })
  }

  for (const material of data.materials) {
    const course = byId(data.courses, material.courseId)
    const s = score(material.title, [material.description, material.type])
    if (s > 0)
      results.push({
        score: s - 5,
        id: material.id,
        kind: 'material',
        title: material.title,
        subtitle: course ? `${course.code} · ${course.title}` : 'Unassigned',
        meta: material.type,
        href: `/courses/${material.courseId}?tab=materials&focus=${material.id}`,
      })
  }

  for (const assignment of data.assignments) {
    const course = byId(data.courses, assignment.courseId)
    const s = score(assignment.title, [assignment.description, assignment.type])
    if (s > 0)
      results.push({
        score: s - 5,
        id: assignment.id,
        kind: 'assignment',
        title: assignment.title,
        subtitle: course ? `${course.code} · ${course.title}` : 'Unassigned',
        meta: assignment.type,
        href: `/courses/${assignment.courseId}?tab=assignments&focus=${assignment.id}`,
      })
  }

  for (const person of data.people) {
    const s = score(person.name, [person.email, person.department, person.title])
    if (s > 0)
      results.push({
        score: s - 10,
        id: person.id,
        kind: 'person',
        title: person.name,
        subtitle: person.title ?? person.email,
        meta: person.role === 'ta' ? 'Teaching assistant' : person.role,
        href: `/people/${person.id}`,
      })
  }

  return results
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit)
    .map(({ score: _score, ...rest }) => rest)
}

/** Tag usage counts across every entity that carries tags. */
export function tagUsage(data: AppData, tagId: string) {
  return {
    courses: data.courses.filter((c) => c.tagIds.includes(tagId)).length,
    materials: data.materials.filter((m) => m.tagIds.includes(tagId)).length,
    assignments: data.assignments.filter((a) => a.tagIds.includes(tagId)).length,
  }
}
