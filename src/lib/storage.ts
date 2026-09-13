import type { AppData } from '../types'
import { seedData } from '../data/seed'

const DATA_KEY = 'acm.data.v1'
const PREFS_KEY = 'acm.prefs.v1'

export interface Preferences {
  theme: 'light' | 'dark' | 'system'
  density: 'comfortable' | 'compact'
  currentUserId: string
  sidebarCollapsed: boolean
  courseView: 'grid' | 'list'
}

export const defaultPreferences: Preferences = {
  theme: 'system',
  density: 'comfortable',
  currentUserId: 'p-nasseri',
  sidebarCollapsed: false,
  courseView: 'grid',
}

/** localStorage is unavailable in some privacy modes; every access is guarded. */
function readJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* quota exceeded or storage blocked — the session stays in memory */
  }
}

const COLLECTIONS: (keyof AppData)[] = [
  'people',
  'semesters',
  'categories',
  'tags',
  'courses',
  'modules',
  'materials',
  'assignments',
  'announcements',
]

export function loadData(): AppData {
  const stored = readJson<Partial<AppData>>(DATA_KEY)
  if (!stored) return structuredClone(seedData)
  // Merge collection by collection so a stored file written by an older
  // version still boots after new collections are added.
  const data = structuredClone(seedData)
  for (const key of COLLECTIONS) {
    const value = stored[key]
    if (Array.isArray(value)) {
      // @ts-expect-error keyed assignment across a union of array types
      data[key] = value
    }
  }
  return data
}

export const saveData = (data: AppData) => writeJson(DATA_KEY, data)

export function loadPreferences(): Preferences {
  return { ...defaultPreferences, ...(readJson<Partial<Preferences>>(PREFS_KEY) ?? {}) }
}

export const savePreferences = (prefs: Preferences) => writeJson(PREFS_KEY, prefs)

export function resetStorage(): void {
  try {
    window.localStorage.removeItem(DATA_KEY)
  } catch {
    /* ignore */
  }
}

export const freshData = (): AppData => structuredClone(seedData)
