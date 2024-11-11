import { useSearchParams } from 'next/navigation';
import en from '../locales/en.json';
import bg from '../locales/bg.json';

const translations = {
  en,
  bg,
};

export const useTranslation = () => {
  const searchParams = useSearchParams();
  const locale = searchParams.get('locale') || 'en'; // Default to 'en' if no locale is specified

  const currentTranslations = translations[locale as keyof typeof translations] || translations['en'];

  const t = (key: string) => {
    const keys = key.split('.');
    return keys.reduce((obj: any, k) => (obj && obj[k] !== undefined ? obj[k] : null), currentTranslations);
  };

  return { t };
};
