import { useMemo } from 'react'
import type { Course, Person } from '../types'
import { useData } from './DataProvider'
import { usePreferences } from './PreferencesProvider'

export interface Session {
  user: Person
  isProfessor: boolean
  isTA: boolean
  isStudent: boolean
  /** Courses the signed-in user teaches or assists. */
  myCourses: Course[]
  /** Professors own a course outright; TAs manage its content but not the course record. */
  canEditCourse: (course: Course) => boolean
  canManageContent: (course: Course) => boolean
  canCreateCourse: boolean
  canManageTaxonomy: boolean
}

export function useSession(): Session {
  const { data } = useData()
  const { prefs } = usePreferences()

  return useMemo(() => {
    const user =
      data.people.find((p) => p.id === prefs.currentUserId) ?? data.people[0]
    const isProfessor = user.role === 'professor'
    const isTA = user.role === 'ta'
    const myCourses = data.courses.filter(
      (c) => c.professorIds.includes(user.id) || c.taIds.includes(user.id),
    )
    return {
      user,
      isProfessor,
      isTA,
      isStudent: user.role === 'student',
      myCourses,
      canEditCourse: (course) => isProfessor && course.professorIds.includes(user.id),
      canManageContent: (course) =>
        (isProfessor && course.professorIds.includes(user.id)) ||
        (isTA && course.taIds.includes(user.id)),
      canCreateCourse: isProfessor,
      canManageTaxonomy: isProfessor,
    }
  }, [data.people, data.courses, prefs.currentUserId])
}
