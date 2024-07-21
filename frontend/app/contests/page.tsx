"use client"

import React, { useState } from 'react';
import Contest from './components/contest';
import Header from '@/components/Header';
import Filters from './components/filters';
import Search from './components/search';

const contests = [
    {
        name: 'Creative Logo Design Contest',
        description: 'Design a unique and memorable logo for our company.',
        link: '#',
        category: 'design',
        startDate: '2023-07-01',
        endDate: '2023-07-31',
        prizeAmount: 500,
    },
    {
        name: 'Photography Contest: Capture the Essence of Nature',
        description: 'Submit your best nature-inspired photographs.',
        link: '#',
        category: 'photography',
        startDate: '2023-08-01',
        endDate: '2023-08-31',
        prizeAmount: 1000,
    },
    {
        name: 'Short Story Writing Competition',
        description: 'Showcase your storytelling skills and win big.',
        link: '#',
        category: 'writing',
        startDate: '2023-09-01',
        endDate: '2023-09-30',
        prizeAmount: 300,
    },
    {
        name: 'Graphic Design Challenge: Redesign Our Website',
        description: 'Revamp our website with a fresh, modern design.',
        link: '#',
        category: 'design',
        startDate: '2023-10-01',
        endDate: '2023-10-31',
        prizeAmount: 700,
    },
];

export default function ContestPage() {
    const [filteredContests, setFilteredContests] = useState(contests);
    const [filters, setFilters] = useState({
        category: '',
        startDate: '',
        endDate: '',
        prizeAmount: '',
    });
    const [searchQuery, setSearchQuery] = useState('');

    const handleFilterChange = (newFilters: any) => {
        setFilters(newFilters);
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    React.useEffect(() => {
        const filtered = contests.filter((contest) => {
            const matchesCategory = filters.category ? filters.category === "all" || contest.category === filters.category : true;
            const matchesStartDate = filters.startDate ? new Date(contest.startDate) >= new Date(filters.startDate) : true;
            const matchesEndDate = filters.endDate ? new Date(contest.endDate) <= new Date(filters.endDate) : true;
            const matchesPrizeAmount = filters.prizeAmount ? contest.prizeAmount >= parseInt(filters.prizeAmount, 10) : true;
            const matchesSearchQuery = searchQuery ? contest.name.toLowerCase().includes(searchQuery.toLowerCase()) : true;

            return matchesCategory && matchesStartDate && matchesEndDate && matchesPrizeAmount && matchesSearchQuery;
        });

        setFilteredContests(filtered);
    }, [filters, searchQuery]);

    return (
        <div className='w-full'>
            <Header />
            <section className='bg-background py-12 md:py-16 lg:py-20'>
                <div className='container mx-auto px-4 md:px-6'>
                    <div className='max-w-3xl'>
                        <h1 className='text-3xl font-bold tracking-tight md:text-4xl'>
                            Explore Exciting Contests
                        </h1>
                        <p className='mt-4 text-muted-foreground md:text-xl'>
                            Browse through a variety of contests and find the
                            perfect one to showcase your talents.
                        </p>
                    </div>
                </div>
            </section>
            <section className='container mx-auto px-4 md:px-6 py-8 md:py-12'>
                <div className='flex flex-col md:flex-row items-start gap-8'>
                    <Filters onFilterChange={handleFilterChange} />
                    <div className='flex-1'>
                        <Search onSearch={handleSearch} />
                        <div className='grid gap-6'>
                            <div className='grid gap-4'>
                                {filteredContests.map(({ name, description, link }) => (
                                    <Contest
                                        key={name}
                                        name={name}
                                        description={description}
                                        link={link}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
