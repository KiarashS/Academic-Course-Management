import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { defaultPreferences, loadPreferences, savePreferences, type Preferences } from '../lib/storage'

interface PreferencesContextValue {
  prefs: Preferences
  setPref: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void
  resetPrefs: () => void
  /** The theme actually applied, after resolving `system`. */
  resolvedTheme: 'light' | 'dark'
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null)

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(() => loadPreferences())
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false,
  )

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  useEffect(() => savePreferences(prefs), [prefs])

  const resolvedTheme = prefs.theme === 'system' ? (systemDark ? 'dark' : 'light') : prefs.theme

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = resolvedTheme
    root.dataset.density = prefs.density
    root.style.colorScheme = resolvedTheme
  }, [resolvedTheme, prefs.density])

  const setPref = useCallback<PreferencesContextValue['setPref']>((key, value) => {
    setPrefs((prev) => ({ ...prev, [key]: value }))
  }, [])

  const value = useMemo(
    () => ({ prefs, setPref, resolvedTheme, resetPrefs: () => setPrefs(defaultPreferences) }),
    [prefs, setPref, resolvedTheme],
  )

  return <PreferencesContext value={value}>{children}</PreferencesContext>
}

export function usePreferences(): PreferencesContextValue {
  const ctx = use(PreferencesContext)
  if (!ctx) throw new Error('usePreferences must be used inside <PreferencesProvider>')
  return ctx
}
