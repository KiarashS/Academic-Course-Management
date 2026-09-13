import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { loadPreferences, savePreferences, type Preferences } from '../lib/storage'

interface PreferencesContextValue {
  prefs: Preferences
  setPref: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void
  /** The theme actually applied, after resolving `system`. */
  resolvedTheme: 'light' | 'dark'
  toggleTheme: () => void
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
    document.documentElement.dataset.theme = resolvedTheme
    document.documentElement.style.colorScheme = resolvedTheme
  }, [resolvedTheme])

  const setPref = useCallback<PreferencesContextValue['setPref']>((key, value) => {
    setPrefs((prev) => ({ ...prev, [key]: value }))
  }, [])

  const toggleTheme = useCallback(() => {
    setPrefs((prev) => ({
      ...prev,
      theme: (prev.theme === 'system'
        ? window.matchMedia?.('(prefers-color-scheme: dark)').matches
          ? 'light'
          : 'dark'
        : prev.theme === 'dark'
          ? 'light'
          : 'dark') as Preferences['theme'],
    }))
  }, [])

  const value = useMemo(
    () => ({ prefs, setPref, resolvedTheme, toggleTheme }),
    [prefs, setPref, resolvedTheme, toggleTheme],
  )

  return <PreferencesContext value={value}>{children}</PreferencesContext>
}

export function usePreferences(): PreferencesContextValue {
  const ctx = use(PreferencesContext)
  if (!ctx) throw new Error('usePreferences must be used inside <PreferencesProvider>')
  return ctx
}
