import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Props = {
    onSearch: (query: string) => void;
};

function Search({ onSearch }: Props) {
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = () => {
        onSearch(searchQuery);
    };

    return (
        <div className='flex items-center gap-4 mb-6'>
            <Input
                type='search'
                placeholder='Search contests...'
                className='flex-1'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button onClick={handleSearch}>Search</Button>
        </div>
    );
}

export default Search;