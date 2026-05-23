import React, { createContext, useContext, useState, useEffect } from 'react'
import { en } from '@/locales/en'
import { vi } from '@/locales/vi'
import { useSettingsStore } from '@/features/settings/stores/settingsStore'

export type Language = 'en' | 'vi'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: typeof en
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app-language')
      if (saved === 'vi' || saved === 'en') return saved
      
      const storeLang = useSettingsStore.getState().account?.language
      if (storeLang === 'Vietnamese') return 'vi'
    }
    return 'en'
  })

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('app-language', lang)
    }

    const storeLang = lang === 'vi' ? 'Vietnamese' : 'English (US)'
    if (useSettingsStore.getState().account?.language !== storeLang) {
      useSettingsStore.getState().updateAccount({ language: storeLang })
    }
  }

  useEffect(() => {
    const unsubscribe = useSettingsStore.subscribe(
      (state) => {
        const newLangStr = state.account?.language
        if (!newLangStr) return
        const mapped = newLangStr === 'Vietnamese' ? 'vi' : 'en'
        if (mapped !== language) {
          setLanguageState(mapped)
          if (typeof window !== 'undefined') {
            localStorage.setItem('app-language', mapped)
          }
        }
      }
    )
    return unsubscribe
  }, [language])

  const t = language === 'vi' ? vi : en

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
