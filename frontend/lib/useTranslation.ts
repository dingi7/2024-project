import { useSearchParams } from 'next/navigation';
import en from '../locales/en.json';
import bg from '../locales/bg.json';

const translations = {
  en,
  bg,
};

export const useTranslation = () => {
  const searchParams = useSearchParams();
  
  // Try to get locale from URL first, then localStorage, finally fallback to 'en'
  let locale = searchParams.get('locale');
  
  if (typeof window !== 'undefined') {
    if (!locale) {
      locale = localStorage.getItem('locale') || 'en';
    } else {
      localStorage.setItem('locale', locale);
    }
  }

  const currentTranslations = translations[locale as keyof typeof translations] || translations['en'];

  const t = (key: string) => {
    const keys = key.split('.');
    return keys.reduce((obj: any, k) => (obj && obj[k] !== undefined ? obj[k] : null), currentTranslations);
  };

  return { t, locale };
};
