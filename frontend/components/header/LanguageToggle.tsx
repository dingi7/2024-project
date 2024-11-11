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
        <SelectItem value="en">English</SelectItem>
        <SelectItem value="bg">Български</SelectItem>
      </SelectContent>
    </Select>
  );
}

export default LanguageToggle;
