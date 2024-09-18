'use client';

import { useEffect, useState } from 'react';
import Contest from './components/contest';
import Filters from './components/filters';
import Search from './components/search';
import { Contest as ContestType, ContestFilters } from '@/lib/types';
import { getContests } from '../api/requests';
import { Skeleton } from '@/components/ui/skeleton';

const ContestPage = () => {
    const [loading, setLoading] = useState(true);
    const [contests, setContests] = useState<ContestType[] | []>([]);
    const [filteredContests, setFilteredContests] = useState<
        ContestType[] | []
    >([]);
    const [filters, setFilters] = useState<ContestFilters>({
        language: '',
        startDate: '',
        endDate: '',
        prize: '',
    });
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchContests = async () => {
            const fetchedContests = await getContests();
            console.log(fetchedContests.sort((a: ContestType, b: ContestType) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            if (fetchedContests) {
                setContests(fetchedContests);
                setFilteredContests(fetchedContests);
            }
            setLoading(false);
        };
        fetchContests();
    }, []);

    useEffect(() => {
        const filtered = contests.filter((contest) => {
            const matchesLanguage = filters.language
                ? filters.language === 'all' ||
                  contest.language === filters.language
                : true;
            const matchesStartDate = filters.startDate
                ? new Date(contest.startDate) >= new Date(filters.startDate)
                : true;
            const matchesEndDate = filters.endDate
                ? new Date(contest.endDate) <= new Date(filters.endDate)
                : true;
            const matchesPrize = filters.prize
                ? contest.prize >= parseInt(filters.prize, 10)
                : true;
            const matchesSearchQuery = searchQuery
                ? contest.title
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase())
                : true;

            return (
                matchesLanguage &&
                matchesStartDate &&
                matchesEndDate &&
                matchesPrize &&
                matchesSearchQuery
            );
        });

        setFilteredContests(filtered);
    }, [filters, searchQuery, contests]);

    const handleFilterChange = (newFilters: ContestFilters) => {
        setFilters(newFilters);
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    const LoadingSkeleton = () => (
        <div className='space-y-4'>
            {[...Array(5)].map((_, index) => (
                <div
                    key={index}
                    className='flex items-center gap-4 bg-background p-4 rounded-lg shadow-sm'
                >
                    <div className='flex-1'>
                        <Skeleton className='h-6 w-3/4 mb-2' />
                        <Skeleton className='h-4 w-full' />
                    </div>
                    <Skeleton className='h-9 w-24' />
                </div>
            ))}
        </div>
    );

    return (
        <div className='w-full flex-1'>
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
                                {loading ? (
                                    <LoadingSkeleton />
                                ) : filteredContests.length > 0 ? (
                                    filteredContests.map((contest) => (
                                        <Contest
                                            key={contest.id}
                                            id={contest.id}
                                            title={contest.title}
                                            description={contest.description}
                                            language={contest.language}
                                            startDate={contest.startDate}
                                            endDate={contest.endDate}
                                            prize={contest.prize}
                                        />
                                    ))
                                ) : (
                                    <div className='text-center text-muted-foreground'>
                                        No contests found.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ContestPage;
