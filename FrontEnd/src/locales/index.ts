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
function deepMerge<T extends object>(target: T, source: object): T {
  const output = { ...target } as any
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sVal = (source as any)[key]
      const tVal = (target as any)[key]
      if (sVal && typeof sVal === 'object' && !Array.isArray(sVal)) {
        if (tVal && typeof tVal === 'object' && !Array.isArray(tVal)) {
          output[key] = deepMerge(tVal, sVal)
        } else {
          output[key] = sVal
        }
      } else if (tVal === undefined) {
        output[key] = sVal
      }
    }
  }
  return output
}

// Prepared translations with complete English fallback overlay
export const translations = {
  en: rawTranslations.en,
  vi: deepMerge(rawTranslations.vi, rawTranslations.en),
  ja: deepMerge(rawTranslations.ja, rawTranslations.en),
  ko: deepMerge(rawTranslations.ko, rawTranslations.en),
}

export type TranslationKey = keyof typeof en
export type Language = 'en' | 'vi' | 'ja' | 'ko'
