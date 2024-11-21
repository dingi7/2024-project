import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import en from '../locales/en.json';
import bg from '../locales/bg.json';

const translations = {
  en,
  bg,
};

export const useTranslation = () => {
  const searchParams = useSearchParams();
  const [locale, setLocale] = useState('bg'); // Default to 'bg' initially
  
  useEffect(() => {
    // Handle client-side locale setting
    const urlLocale = searchParams.get('locale');
    const savedLocale = localStorage.getItem('locale');
    
    const newLocale = urlLocale || savedLocale || 'bg';
    setLocale(newLocale);
    
    if (urlLocale) {
      localStorage.setItem('locale', urlLocale);
    }
  }, [searchParams]);

  const currentTranslations = translations[locale as keyof typeof translations] || translations['bg'];

  const t = (key: string) => {
    const keys = key.split('.');
    return keys.reduce((obj: any, k) => (obj && obj[k] !== undefined ? obj[k] : null), currentTranslations);
  };

  return { t, locale };
};
