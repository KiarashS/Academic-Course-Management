import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  Announcement,
  AppData,
  Assignment,
  Category,
  Course,
  Material,
  Module,
  Person,
  Semester,
  Tag,
} from '../types'
import { discardDraft, loadData, publishedData, saveData } from '../lib/storage'
import { createId } from '../lib/id'

type Draft<T extends { id: string }> = Omit<T, 'id' | 'createdAt' | 'updatedAt'> &
  Partial<Pick<T, 'id'>>

interface DataContextValue {
  data: AppData
  /* Courses */
  addCourse: (draft: Draft<Course>) => Course
  updateCourse: (id: string, patch: Partial<Course>) => void
  deleteCourse: (id: string) => void
  archiveCourse: (id: string) => void
  restoreCourse: (id: string) => void
  duplicateCourse: (id: string, semesterId: string) => Course | undefined
  /* Materials */
  addMaterial: (draft: Draft<Material>) => Material
  updateMaterial: (id: string, patch: Partial<Material>) => void
  deleteMaterial: (id: string) => void
  registerDownload: (id: string) => void
  /* Assignments */
  addAssignment: (draft: Draft<Assignment>) => Assignment
  updateAssignment: (id: string, patch: Partial<Assignment>) => void
  deleteAssignment: (id: string) => void
  /* Modules */
  addModule: (draft: Omit<Module, 'id'>) => Module
  updateModule: (id: string, patch: Partial<Module>) => void
  deleteModule: (id: string) => void
  /* Announcements */
  addAnnouncement: (draft: Omit<Announcement, 'id' | 'createdAt'>) => Announcement
  updateAnnouncement: (id: string, patch: Partial<Announcement>) => void
  deleteAnnouncement: (id: string) => void
  /* Taxonomy and people */
  addTag: (name: string, color: string) => Tag
  updateTag: (id: string, patch: Partial<Tag>) => void
  deleteTag: (id: string) => void
  addCategory: (draft: Omit<Category, 'id'>) => Category
  updateCategory: (id: string, patch: Partial<Category>) => void
  deleteCategory: (id: string) => void
  addSemester: (draft: Omit<Semester, 'id'>) => Semester
  updateSemester: (id: string, patch: Partial<Semester>) => void
  deleteSemester: (id: string) => void
  setCurrentSemester: (id: string) => void
  addPerson: (draft: Omit<Person, 'id'>) => Person
  updatePerson: (id: string, patch: Partial<Person>) => void
  deletePerson: (id: string) => void
  /* Whole-dataset operations */
  replaceData: (next: AppData) => void
  /** Throws away local edits and returns to what content/courses.yaml publishes. */
  revertToPublished: () => void
  /** True while the browser is showing edits that are not in the content file. */
  isDraft: boolean
  /** When those edits were last written to this browser. */
  draftSavedAt?: string
}

const DataContext = createContext<DataContextValue | null>(null)

const now = () => new Date().toISOString()

export function DataProvider({ children }: { children: ReactNode }) {
  const [loaded] = useState(() => loadData())
  const [data, setData] = useState<AppData>(loaded.data)
  const [isDraft, setIsDraft] = useState(loaded.isDraft)
  const [draftSavedAt, setDraftSavedAt] = useState(loaded.savedAt)
  // The first render is the published content; only real edits create a draft.
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (dirty) saveData(data)
  }, [data, dirty])

  /** Every mutation goes through here so drafts are tracked in one place. */
  const edit = useCallback((update: (prev: AppData) => AppData) => {
    setDirty(true)
    setIsDraft(true)
    setDraftSavedAt(new Date().toISOString())
    setData(update)
  }, [])

  /** Generic list updater: replaces one record inside one collection. */
  const patchIn = useCallback(
    <K extends keyof AppData>(key: K, id: string, patch: object, stamp = true) => {
      edit((prev) => ({
        ...prev,
        [key]: (prev[key] as { id: string }[]).map((item) =>
          item.id === id ? { ...item, ...patch, ...(stamp ? { updatedAt: now() } : {}) } : item,
        ),
      }))
    },
    [edit],
  )

  const removeFrom = useCallback(
    <K extends keyof AppData>(key: K, id: string) => {
      edit((prev) => ({
        ...prev,
        [key]: (prev[key] as { id: string }[]).filter((item) => item.id !== id),
      }))
    },
    [edit],
  )

  const value = useMemo<DataContextValue>(() => {
    return {
      data,

      addCourse: (draft) => {
        const course: Course = {
          ...(draft as Omit<Course, 'id' | 'createdAt' | 'updatedAt'>),
          id: draft.id ?? createId('c'),
          createdAt: now(),
          updatedAt: now(),
        }
        edit((prev) => ({ ...prev, courses: [course, ...prev.courses] }))
        return course
      },
      updateCourse: (id, patch) => patchIn('courses', id, patch),
      deleteCourse: (id) =>
        edit((prev) => ({
          ...prev,
          courses: prev.courses.filter((c) => c.id !== id),
          materials: prev.materials.filter((m) => m.courseId !== id),
          assignments: prev.assignments.filter((a) => a.courseId !== id),
          modules: prev.modules.filter((m) => m.courseId !== id),
          announcements: prev.announcements.filter((a) => a.courseId !== id),
        })),
      archiveCourse: (id) =>
        patchIn('courses', id, { status: 'archived', archivedAt: now() }),
      restoreCourse: (id) =>
        patchIn('courses', id, { status: 'published', archivedAt: undefined }),
      duplicateCourse: (id, semesterId) => {
        const source = data.courses.find((c) => c.id === id)
        if (!source) return undefined
        const copyId = createId('c')
        const copy: Course = {
          ...source,
          id: copyId,
          title: `${source.title} (copy)`,
          semesterId,
          status: 'draft',
          enrolled: 0,
          archivedAt: undefined,
          createdAt: now(),
          updatedAt: now(),
        }
        const moduleIdMap = new Map<string, string>()
        const modules = data.modules
          .filter((m) => m.courseId === id)
          .map((m) => {
            const newId = createId('mod')
            moduleIdMap.set(m.id, newId)
            return { ...m, id: newId, courseId: copyId }
          })
        const materials = data.materials
          .filter((m) => m.courseId === id)
          .map((m) => ({
            ...m,
            id: createId('mat'),
            courseId: copyId,
            moduleId: m.moduleId ? moduleIdMap.get(m.moduleId) : undefined,
            downloads: 0,
            createdAt: now(),
            updatedAt: now(),
          }))
        edit((prev) => ({
          ...prev,
          courses: [copy, ...prev.courses],
          modules: [...prev.modules, ...modules],
          materials: [...prev.materials, ...materials],
        }))
        return copy
      },

      addMaterial: (draft) => {
        const material: Material = {
          ...(draft as Omit<Material, 'id' | 'createdAt' | 'updatedAt'>),
          id: draft.id ?? createId('mat'),
          createdAt: now(),
          updatedAt: now(),
        }
        edit((prev) => ({ ...prev, materials: [material, ...prev.materials] }))
        return material
      },
      updateMaterial: (id, patch) => patchIn('materials', id, patch),
      deleteMaterial: (id) => removeFrom('materials', id),
      registerDownload: (id) =>
        edit((prev) => ({
          ...prev,
          materials: prev.materials.map((m) =>
            m.id === id ? { ...m, downloads: m.downloads + 1 } : m,
          ),
        })),

      addAssignment: (draft) => {
        const assignment: Assignment = {
          ...(draft as Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>),
          id: draft.id ?? createId('a'),
          createdAt: now(),
          updatedAt: now(),
        }
        edit((prev) => ({ ...prev, assignments: [assignment, ...prev.assignments] }))
        return assignment
      },
      updateAssignment: (id, patch) => patchIn('assignments', id, patch),
      deleteAssignment: (id) => removeFrom('assignments', id),

      addModule: (draft) => {
        const module: Module = { ...draft, id: createId('mod') }
        edit((prev) => ({ ...prev, modules: [...prev.modules, module] }))
        return module
      },
      updateModule: (id, patch) => patchIn('modules', id, patch, false),
      deleteModule: (id) =>
        edit((prev) => ({
          ...prev,
          modules: prev.modules.filter((m) => m.id !== id),
          materials: prev.materials.map((m) =>
            m.moduleId === id ? { ...m, moduleId: undefined } : m,
          ),
        })),

      addAnnouncement: (draft) => {
        const announcement: Announcement = { ...draft, id: createId('an'), createdAt: now() }
        edit((prev) => ({ ...prev, announcements: [announcement, ...prev.announcements] }))
        return announcement
      },
      updateAnnouncement: (id, patch) => patchIn('announcements', id, patch, false),
      deleteAnnouncement: (id) => removeFrom('announcements', id),

      addTag: (name, color) => {
        const existing = data.tags.find((t) => t.name.toLowerCase() === name.toLowerCase())
        if (existing) return existing
        const tag: Tag = { id: createId('tag'), name, color }
        edit((prev) => ({ ...prev, tags: [...prev.tags, tag] }))
        return tag
      },
      updateTag: (id, patch) => patchIn('tags', id, patch, false),
      deleteTag: (id) =>
        edit((prev) => ({
          ...prev,
          tags: prev.tags.filter((t) => t.id !== id),
          courses: prev.courses.map((c) => ({ ...c, tagIds: c.tagIds.filter((t) => t !== id) })),
          materials: prev.materials.map((m) => ({
            ...m,
            tagIds: m.tagIds.filter((t) => t !== id),
          })),
          assignments: prev.assignments.map((a) => ({
            ...a,
            tagIds: a.tagIds.filter((t) => t !== id),
          })),
        })),

      addCategory: (draft) => {
        const category: Category = { ...draft, id: createId('cat') }
        edit((prev) => ({ ...prev, categories: [...prev.categories, category] }))
        return category
      },
      updateCategory: (id, patch) => patchIn('categories', id, patch, false),
      deleteCategory: (id) => removeFrom('categories', id),

      addSemester: (draft) => {
        const semester: Semester = { ...draft, id: createId('sem') }
        edit((prev) => ({ ...prev, semesters: [semester, ...prev.semesters] }))
        return semester
      },
      updateSemester: (id, patch) => patchIn('semesters', id, patch, false),
      deleteSemester: (id) => removeFrom('semesters', id),
      setCurrentSemester: (id) =>
        edit((prev) => ({
          ...prev,
          semesters: prev.semesters.map((s) => ({ ...s, current: s.id === id })),
        })),

      addPerson: (draft) => {
        const person: Person = { ...draft, id: createId('u') }
        edit((prev) => ({ ...prev, people: [...prev.people, person] }))
        return person
      },
      updatePerson: (id, patch) => patchIn('people', id, patch, false),
      deletePerson: (id) =>
        edit((prev) => ({
          ...prev,
          people: prev.people.filter((p) => p.id !== id),
          courses: prev.courses.map((c) => ({
            ...c,
            professorIds: c.professorIds.filter((p) => p !== id),
            taIds: c.taIds.filter((p) => p !== id),
          })),
        })),

      replaceData: (next) => edit(() => next),
      revertToPublished: () => {
        discardDraft()
        setDirty(false)
        setIsDraft(false)
        setDraftSavedAt(undefined)
        setData(publishedData())
      },
      isDraft,
      draftSavedAt,
    }
  }, [data, patchIn, removeFrom, edit, isDraft, draftSavedAt])

  return <DataContext value={value}>{children}</DataContext>
}

export function useData(): DataContextValue {
  const ctx = use(DataContext)
  if (!ctx) throw new Error('useData must be used inside <DataProvider>')
  return ctx
}
