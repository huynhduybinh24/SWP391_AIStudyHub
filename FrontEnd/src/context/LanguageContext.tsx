import React, { createContext, useContext, useState, useEffect } from 'react'
import { translations, Language } from '@/locales'
import { useSettingsStore } from '@/features/settings/stores/settingsStore'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: typeof translations.en
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aiStudyHubLanguage') || localStorage.getItem('app-language')
      if (saved === 'vi' || saved === 'en' || saved === 'ja' || saved === 'ko') {
        return saved as Language
      }
      
      const storeLang = useSettingsStore.getState().account?.language
      if (storeLang === 'Vietnamese' || storeLang === 'vi') return 'vi'
      if (storeLang === 'Japanese' || storeLang === 'ja') return 'ja'
      if (storeLang === 'Korean' || storeLang === 'ko') return 'ko'
    }
    return 'en'
  })

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('app-language', lang)
      localStorage.setItem('aiStudyHubLanguage', lang)
    }

    if (useSettingsStore.getState().account?.language !== lang) {
      useSettingsStore.getState().updateAccount({ language: lang })
    }
  }

  useEffect(() => {
    const unsubscribe = useSettingsStore.subscribe(
      (state) => {
        const newLangStr = state.account?.language
        if (!newLangStr) return
        let mapped: Language = 'en'
        if (newLangStr === 'Vietnamese' || newLangStr === 'vi') mapped = 'vi'
        else if (newLangStr === 'Japanese' || newLangStr === 'ja') mapped = 'ja'
        else if (newLangStr === 'Korean' || newLangStr === 'ko') mapped = 'ko'
        else if (newLangStr === 'English (US)' || newLangStr === 'en') mapped = 'en'

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
