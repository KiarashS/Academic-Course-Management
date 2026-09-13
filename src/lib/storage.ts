import type { AppData } from '../types'
import { content } from '../content/loadContent'

const DATA_KEY = 'acm.draft.v2'
const PREFS_KEY = 'acm.prefs.v1'

export interface Preferences {
  theme: 'light' | 'dark' | 'system'
  density: 'comfortable' | 'compact'
  currentUserId: string
  sidebarCollapsed: boolean
  courseView: 'grid' | 'list'
}

const firstStaffId =
  content.data.people.find((p) => p.role === 'professor')?.id ?? content.data.people[0]?.id ?? ''

export const defaultPreferences: Preferences = {
  theme: 'system',
  density: 'comfortable',
  currentUserId: firstStaffId,
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

interface StoredDraft {
  /** Hash of the content file this draft was branched from. */
  fingerprint: string
  savedAt: string
  data: AppData
}

/** The content file as published, with no local edits applied. */
export const publishedData = (): AppData => structuredClone(content.data)

export interface LoadResult {
  data: AppData
  /** True when the browser is showing unpublished local edits. */
  isDraft: boolean
  /** Set when a draft was discarded because the content file moved on. */
  discardedDraft: boolean
  savedAt?: string
}

/**
 * The content file wins whenever it changes: a draft saved against an older
 * version is dropped rather than silently shadowing newly published courses.
 */
export function loadData(): LoadResult {
  const stored = readJson<StoredDraft>(DATA_KEY)
  if (!stored || typeof stored !== 'object' || !stored.data) {
    return { data: publishedData(), isDraft: false, discardedDraft: false }
  }
  if (stored.fingerprint !== content.fingerprint) {
    try {
      window.localStorage.removeItem(DATA_KEY)
    } catch {
      /* ignore */
    }
    return { data: publishedData(), isDraft: false, discardedDraft: true }
  }
  const data = publishedData()
  for (const key of COLLECTIONS) {
    const value = stored.data[key]
    if (Array.isArray(value)) {
      // @ts-expect-error keyed assignment across a union of array types
      data[key] = value
    }
  }
  return { data, isDraft: true, discardedDraft: false, savedAt: stored.savedAt }
}

export const saveData = (data: AppData) =>
  writeJson(DATA_KEY, {
    fingerprint: content.fingerprint,
    savedAt: new Date().toISOString(),
    data,
  } satisfies StoredDraft)

export function discardDraft(): void {
  try {
    window.localStorage.removeItem(DATA_KEY)
  } catch {
    /* ignore */
  }
}

export function loadPreferences(): Preferences {
  const stored = { ...defaultPreferences, ...(readJson<Partial<Preferences>>(PREFS_KEY) ?? {}) }
  // A person removed from the content file must not leave the app signed in as them.
  if (!content.data.people.some((p) => p.id === stored.currentUserId)) {
    stored.currentUserId = defaultPreferences.currentUserId
  }
  return stored
}

export const savePreferences = (prefs: Preferences) => writeJson(PREFS_KEY, prefs)
