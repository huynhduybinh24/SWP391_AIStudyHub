import React, { createContext, useContext, useState, useEffect } from 'react'
import { translations, Language } from '@/locales'
import { useSettingsStore } from '@/features/settings/stores/settingsStore'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: typeof translations.en
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const supportedLanguages = ['en', 'vi'] as const

function normalizeLanguage(value: string | null): 'en' | 'vi' {
  return value === 'vi' || value === 'en' ? value : 'en'
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aiStudyHubLanguage') || localStorage.getItem('app-language')
      let initialLanguage: 'en' | 'vi' = 'en'
      
      if (saved === 'vi' || saved === 'en') {
        initialLanguage = saved
      } else {
        const storeLang = useSettingsStore.getState().account?.language
        if (storeLang === 'Vietnamese' || storeLang === 'vi') {
          initialLanguage = 'vi'
        } else {
          initialLanguage = 'en'
        }
        localStorage.setItem('aiStudyHubLanguage', initialLanguage)
        localStorage.setItem('app-language', initialLanguage)
      }
      return initialLanguage
    }
    return 'en'
  })

  const setLanguage = (lang: Language) => {
    const normalized = normalizeLanguage(lang)
    setLanguageState(normalized)
    if (typeof window !== 'undefined') {
      localStorage.setItem('app-language', normalized)
      localStorage.setItem('aiStudyHubLanguage', normalized)
    }

    if (useSettingsStore.getState().account?.language !== normalized) {
      useSettingsStore.getState().updateAccount({ language: normalized })
    }
  }

  useEffect(() => {
    const unsubscribe = useSettingsStore.subscribe(
      (state) => {
        const newLangStr = state.account?.language
        if (!newLangStr) return
        let mapped: Language = 'en'
        if (newLangStr === 'Vietnamese' || newLangStr === 'vi') mapped = 'vi'
        else if (newLangStr === 'English (US)' || newLangStr === 'en') mapped = 'en'
        else mapped = 'en'

        if (mapped !== language) {
          setLanguageState(mapped)
          if (typeof window !== 'undefined') {
            localStorage.setItem('app-language', mapped)
            localStorage.setItem('aiStudyHubLanguage', mapped)
          }
        }
      }
    )
    return unsubscribe
  }, [language])

  // Retrieve translation dictionary with deep merged fallbacks
  const t = translations[language] || translations.en

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider')
  }
  return context
}
