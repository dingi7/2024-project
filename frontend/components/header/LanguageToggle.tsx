'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

type Props = {};

function LanguageToggle({}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = searchParams.get('locale') || 'en'; // Default locale if none is set

  const handleLanguageChange = (newLocale: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('locale', newLocale);

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Select
      value={locale}
      onValueChange={handleLanguageChange}
      defaultValue={locale}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select a language" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="12" viewBox="0 0 60 30">
              <clipPath id="a"><path d="M0 0v30h60V0z"/></clipPath>
              <path fill="#012169" d="M0 0v30h60V0z"/>
              <path stroke="#fff" strokeWidth="6" d="M0 0l60 30m0-30L0 30" clipPath="url(#a)"/>
              <path stroke="#C8102E" strokeWidth="4" d="M0 0l60 30m0-30L0 30" clipPath="url(#a)"/>
              <path stroke="#fff" strokeWidth="10" d="M30 0v30M0 15h60"/>
              <path stroke="#C8102E" strokeWidth="6" d="M30 0v30M0 15h60"/>
            </svg>
            English
          </div>
        </SelectItem>
        <SelectItem value="bg">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="12" viewBox="0 0 5 3">
              <rect width="5" height="3" fill="#fff"/>
              <rect width="5" height="1" y="1" fill="#00966E"/>
              <rect width="5" height="1" y="2" fill="#D62612"/>
            </svg>
            Български
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

export default LanguageToggle;
