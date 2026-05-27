import { en } from './en'
import { vi } from './vi'
import { ja } from './ja'
import { ko } from './ko'

export const rawTranslations = {
  en,
  vi,
  ja,
  ko,
}

// Deep merge utility to fallback individual missing nested keys or functions to English defaults
function deepMerge<T extends object>(target: T, source: object, path = '', lang = ''): T {
  const output = { ...target } as any
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sVal = (source as any)[key]
      const tVal = (target as any)[key]
      const currentPath = path ? `${path}.${key}` : key

      if (sVal && typeof sVal === 'object' && !Array.isArray(sVal)) {
        if (tVal && typeof tVal === 'object' && !Array.isArray(tVal)) {
          output[key] = deepMerge(tVal, sVal, currentPath, lang)
        } else {
          if (import.meta.env.DEV && lang === 'vi') {
            console.warn(`[i18n] Missing translation key: ${currentPath} for language: ${lang}`)
          }
          output[key] = sVal
        }
      } else if (tVal === undefined) {
        if (import.meta.env.DEV && lang === 'vi') {
          console.warn(`[i18n] Missing translation key: ${currentPath} for language: ${lang}`)
        }
        output[key] = sVal
      }
    }
  }
  return output
}

// Prepared translations with complete English fallback overlay
export const translations = {
  en: rawTranslations.en,
  vi: deepMerge(rawTranslations.vi, rawTranslations.en, '', 'vi') as typeof en,
  ja: deepMerge(rawTranslations.ja as any, rawTranslations.en, '', 'ja') as typeof en,
  ko: deepMerge(rawTranslations.ko as any, rawTranslations.en, '', 'ko') as typeof en,
}

export type TranslationKey = keyof typeof en
export type Language = 'en' | 'vi' | 'ja' | 'ko'
