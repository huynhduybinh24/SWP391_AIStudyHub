import { createContext, useContext, useEffect, useState } from 'react'
import { useToast } from '@/components/ui/Toast'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme, skipToast?: boolean) => void
  resolvedTheme: 'light' | 'dark'
  applyTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('ai-study-hub-theme') as Theme) || 'light'
    }
    return 'light'
  })
  
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = (localStorage.getItem('ai-study-hub-theme') as Theme) || 'light'
      if (saved === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
      return saved === 'dark' ? 'dark' : 'light'
    }
    return 'light'
  })

  const toast = useToast()

  const applyTheme = (targetTheme: Theme) => {
    if (typeof window === 'undefined') return
    const root = window.document.documentElement

    if (targetTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        root.classList.add('dark')
        setResolvedTheme('dark')
      } else {
        root.classList.remove('dark')
        setResolvedTheme('light')
      }
    } else {
      if (targetTheme === 'dark') {
        root.classList.add('dark')
        setResolvedTheme('dark')
      } else {
        root.classList.remove('dark')
        setResolvedTheme('light')
      }
    }
  }

  const setTheme = (newTheme: Theme, skipToast = false) => {
    setThemeState(newTheme)
    if (typeof window !== 'undefined') {
      localStorage.setItem('ai-study-hub-theme', newTheme)
    }

    applyTheme(newTheme)

    if (!skipToast) {
      const capitalizedTheme = newTheme.charAt(0).toUpperCase() + newTheme.slice(1)
      toast.success(`${capitalizedTheme} theme enabled`)
    }
  }

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Apply the theme initially
    applyTheme(theme)

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = (e: MediaQueryListEvent) => {
        const root = window.document.documentElement
        if (e.matches) {
          root.classList.add('dark')
          setResolvedTheme('dark')
        } else {
          root.classList.remove('dark')
          setResolvedTheme('light')
        }
      }

      mediaQuery.addEventListener('change', handler)
      return () => {
        mediaQuery.removeEventListener('change', handler)
      }
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme, applyTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
