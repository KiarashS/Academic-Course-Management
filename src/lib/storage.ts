/**
 * The site is static: all content comes from content/courses.yaml at build
 * time. The only thing worth remembering per visitor is how they like it to
 * look, so this is the whole of the browser's persistent state.
 */
const PREFS_KEY = 'coursehub.prefs.v1'

export interface Preferences {
  theme: 'light' | 'dark' | 'system'
  sidebarOpen: boolean
}

export const defaultPreferences: Preferences = {
  theme: 'system',
  sidebarOpen: true,
}

/** localStorage throws in some privacy modes; every access is guarded. */
export function loadPreferences(): Preferences {
  try {
    const raw = window.localStorage.getItem(PREFS_KEY)
    return { ...defaultPreferences, ...(raw ? (JSON.parse(raw) as Partial<Preferences>) : {}) }
  } catch {
    return { ...defaultPreferences }
  }
}

export function savePreferences(prefs: Preferences): void {
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch {
    /* storage blocked — preferences last for the session only */
  }
}
