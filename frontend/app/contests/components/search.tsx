import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/useTranslation';

const Search = ({ onSearch }: { onSearch: (query: string) => void }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const { t } = useTranslation();

    const handleSearch = () => {
        onSearch(searchQuery);
    };

    return (
        <div className='flex items-center gap-4 mb-6'>
            <Input
                type='search'
                placeholder={t('common.searchContests')}
                className='flex-1'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button onClick={handleSearch}>{t('common.searchButton')}</Button>
        </div>
    );
};

export default Search;
