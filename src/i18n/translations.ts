import { Language, LanguageInfo } from '../types';
import { TranslationDict } from './types';
import { en } from './locales/en';
import { de } from './locales/de';
import { bn } from './locales/bn';
import { hi } from './locales/hi';
import { ur } from './locales/ur';
import { ar } from './locales/ar';
import { fa } from './locales/fa';
import { tr } from './locales/tr';

export type { Language, LanguageInfo, TranslationDict };

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', dir: 'ltr' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩', dir: 'ltr' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', dir: 'ltr' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', dir: 'rtl' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', flag: '🇮🇷', dir: 'rtl' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', dir: 'ltr' },
];

export const TRANSLATIONS: Record<Language, TranslationDict> = {
  en,
  de,
  bn,
  hi,
  ur,
  ar,
  fa,
  tr,
};

/**
 * Auto-detect user's browser language, defaulting to 'en'
 */
export function detectBrowserLanguage(): Language {
  if (typeof window === 'undefined' || !navigator.language) {
    return 'en';
  }
  const full = navigator.language.toLowerCase();
  const primary = full.split('-')[0];

  if (primary === 'de') return 'de';
  if (primary === 'bn') return 'bn';
  if (primary === 'hi') return 'hi';
  if (primary === 'ur') return 'ur';
  if (primary === 'ar') return 'ar';
  if (primary === 'fa') return 'fa';
  if (primary === 'tr') return 'tr';
  return 'en';
}
