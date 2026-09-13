import type { AppData, Course } from '../types'
import type { RawContent, RawCourse } from './types'
import { content, resolveFileUrl } from './loadContent'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const pad = (value: number) => String(value).padStart(2, '0')

/** Dates go back out in the same local-time shape the file uses. */
function toYamlDate(iso: string, withTime = false): string {
  const date = new Date(iso)
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  if (!withTime || (date.getHours() === 0 && date.getMinutes() === 0)) return day
  return `${day} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Turns an absolute material URL back into a path inside the course folder. */
function toFileRef(url: string, folder: string): { file?: string; url?: string } {
  const prefix = resolveFileUrl(folder, '')
  return url.startsWith(prefix) ? { file: url.slice(prefix.length) } : { url }
}

const omitEmpty = <T extends object>(value: T): T =>
  Object.fromEntries(
    Object.entries(value).filter(([, v]) => {
      if (v === undefined || v === null || v === '') return false
      if (Array.isArray(v) && v.length === 0) return false
      return true
    }),
  ) as T

function courseToRaw(data: AppData, course: Course): RawCourse {
  const folder = course.id
  const modules = data.modules
    .filter((m) => m.courseId === course.id)
    .sort((a, b) => a.order - b.order)
  const shortModuleId = (id: string | undefined) =>
    id ? (modules.find((m) => m.id === id)?.id.replace(`${course.id}--`, '') ?? undefined) : undefined

  return omitEmpty({
    id: course.id,
    code: course.code,
    title: course.title,
    semester: course.semesterId,
    category: course.categoryId,
    status: course.status,
    level: course.level,
    credits: course.credits,
    capacity: course.capacity,
    enrolled: course.enrolled,
    color: course.color,
    location: course.location,
    language: course.language === 'English' ? undefined : course.language,
    professors: course.professorIds,
    assistants: course.taIds,
    tags: course.tagIds,
    summary: course.summary,
    description: course.description,
    prerequisites: course.prerequisites,
    objectives: course.objectives,
    archived: course.archivedAt ? toYamlDate(course.archivedAt) : undefined,
    schedule: course.meetingTimes.map((meeting) =>
      omitEmpty({
        day: DAY_NAMES[meeting.day],
        start: meeting.start,
        end: meeting.end,
        room: meeting.room,
      }),
    ),
    grading: course.gradingScheme,
    modules: modules.map((module) =>
      omitEmpty({
        id: module.id.replace(`${course.id}--`, ''),
        title: module.title,
        summary: module.summary,
      }),
    ),
    materials: data.materials
      .filter((m) => m.courseId === course.id)
      .map((material) =>
        omitEmpty({
          title: material.title,
          type: material.type,
          ...toFileRef(material.url, folder),
          module: shortModuleId(material.moduleId),
          week: material.week,
          author: material.authorId,
          tags: material.tagIds,
          description: material.description,
          added: toYamlDate(material.createdAt),
          visible: material.visible ? undefined : false,
          downloads: material.downloads || undefined,
        }),
      ),
    assignments: data.assignments
      .filter((a) => a.courseId === course.id)
      .map((assignment) =>
        omitEmpty({
          title: assignment.title,
          type: assignment.type,
          released: toYamlDate(assignment.releaseDate, true),
          due: toYamlDate(assignment.dueDate, true),
          points: assignment.points,
          weight: assignment.weight,
          author: assignment.authorId,
          tags: assignment.tagIds,
          attachment: assignment.attachmentUrl
            ? (toFileRef(assignment.attachmentUrl, folder).file ?? assignment.attachmentUrl)
            : undefined,
          allowLate: assignment.allowLate ? undefined : false,
          published: assignment.published ? undefined : false,
          submissions: assignment.submissions || undefined,
          graded: assignment.graded || undefined,
          description: assignment.description,
        }),
      ),
    announcements: data.announcements
      .filter((a) => a.courseId === course.id)
      .map((announcement) =>
        omitEmpty({
          title: announcement.title,
          author: announcement.authorId,
          date: toYamlDate(announcement.createdAt, true),
          pinned: announcement.pinned ? true : undefined,
          body: announcement.body,
        }),
      ),
  }) as RawCourse

}

export function toRawContent(data: AppData): RawContent {
  return {
    site: content.site,
    semesters: data.semesters.map((semester) =>
      omitEmpty({
        id: semester.id,
        term: semester.term,
        year: semester.year,
        start: toYamlDate(semester.startDate),
        end: toYamlDate(semester.endDate),
        current: semester.current ? true : undefined,
      }),
    ),
    categories: data.categories.map((category) =>
      omitEmpty({
        id: category.id,
        name: category.name,
        color: category.color,
        description: category.description,
      }),
    ),
    tags: data.tags.map((tag) => ({ id: tag.id, name: tag.name, color: tag.color })),
    people: data.people.map((person) =>
      omitEmpty({
        id: person.id,
        name: person.name,
        email: person.email,
        role: person.role,
        title: person.title,
        department: person.department,
        office: person.office,
        officeHours: person.officeHours,
        phone: person.phone,
        website: person.website,
        color: person.avatarColor,
        bio: person.bio,
      }),
    ),
    courses: data.courses.map((course) => courseToRaw(data, course)),
  }
}

const HEADER = `# Generated by Course Hub from the browser's local draft.
# Review it, then replace content/courses.yaml with this file and redeploy.
#
# File references are relative to public/courses/<course id>/.

`

/** js-yaml is pulled in only when someone actually exports. */
export async function exportYaml(data: AppData): Promise<string> {
  const { dump } = await import('js-yaml')
  return (
    HEADER +
    dump(toRawContent(data), { lineWidth: 96, noRefs: true })
  )
}
