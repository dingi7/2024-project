'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcwIcon } from 'lucide-react';
import ContestDetails from './components/ContestDetails';
import SubmissionForm from './components/SubmissionForm';
import SubmissionTable from './components/SubmissionTable';
import { useSession } from 'next-auth/react';
import { codeSubmit } from '@/app/api/requests';

export default function ContestPage() {
    const { data: session } = useSession();
    const [isOwner, setIsOwner] = useState(true);
    const [isEditEnabled, setIsEditEnabled] = useState(false);
    const [contest, setContest] = useState({
        title: 'Code Challenge: Optimize Sorting Algorithm',
        description:
            'Design and implement an optimized sorting algorithm that can handle large datasets efficiently.',
        startDate: '2023-06-01',
        endDate: '2023-06-30',
        prize: '$5,000',
        rulesFile: null,
        otherFiles: null,
    });
    const [submissions, setSubmissions] = useState([
        {
            id: 1,
            date: '2023-06-15',
            status: 'Accepted',
            score: 95,
            language: 'JavaScript',
            code: 'function sortArray(arr) { /* optimized sorting algorithm */ }',
        },
        {
            id: 2,
            date: '2023-06-20',
            status: 'Rejected',
            score: 80,
            language: 'Python',
            code: 'def sort_array(arr): # optimized sorting algorithm',
        },
        {
            id: 3,
            date: '2023-06-25',
            status: 'Pending',
            score: null,
            language: 'Java',
            code: 'public static void sortArray(int[] arr) { /* optimized sorting algorithm */ }',
        },
    ]);
    const [filterOptions, setFilterOptions] = useState({
        status: 'all',
        sortBy: 'date',
        order: 'desc',
    });

    const handleEditContest = (updatedContest: any) => {
        setContest(updatedContest);
    };

    const handleFilterChange = (filters: any) => {
        setFilterOptions(filters);
    };

    const handleSubmit = async(solution: any) => {
        // here
        const submission = {
            ...solution,
            // ownerId: session!.user!.id,
        };
        await codeSubmit(submission);
        // setSubmissions([
        //     ...submissions,
        //     {
        //         id: submissions.length + 1,
        //         date: new Date().toISOString().slice(0, 10),
        //         status: 'Pending',
        //         score: null,
        //         language: solution.language,
        //         code: solution.code,
        //     },
        // ]);
    };

    const filteredSubmissions = useMemo(() => {
        let filtered = submissions;
        if (filterOptions.status !== 'all') {
            filtered = filtered.filter(
                (s) => s.status === filterOptions.status
            );
        }
        if (filterOptions.sortBy === 'date') {
            filtered = filtered.sort((a, b) =>
                filterOptions.order === 'asc'
                    ? new Date(a.date).getTime() - new Date(b.date).getTime()
                    : new Date(b.date).getTime() - new Date(a.date).getTime()
            );
        } else if (filterOptions.sortBy === 'score') {
            filtered = filtered.sort((a, b) =>
                filterOptions.order === 'asc'
                    ? (a.score ?? 0) - (b.score ?? 0)
                    : (b.score ?? 0) - (a.score ?? 0)
            );
        }
        return filtered;
    }, [submissions, filterOptions]);

    const handleRefresh = () => {
        const updatedSubmissions = submissions.map((submission) => {
            if (submission.status === 'Pending') {
                return {
                    ...submission,
                    status: 'Accepted',
                    score: Math.floor(Math.random() * 100),
                };
            }
            return submission;
        });
        setSubmissions(updatedSubmissions);
    };

    return (
        <div className='flex flex-col flex-1'>
            <div className='container mx-auto py-8 px-4 md:px-6'>
                <div className='flex items-center justify-between mb-6'>
                    <h1 className='text-2xl font-bold'>Code Challenge</h1>
                    <div className='flex gap-2'>
                        <SubmissionForm onSubmit={handleSubmit} />
                        {isOwner && (
                            <Button
                                onClick={() => setIsEditEnabled(!isEditEnabled)}
                            >
                                Edit Contest
                            </Button>
                        )}
                        <Button variant='outline' onClick={handleRefresh}>
                            <RefreshCcwIcon className='w-4 h-4 mr-2' />
                            Refresh
                        </Button>
                    </div>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
                    <ContestDetails
                        contest={contest}
                        isOwner={isOwner}
                        isEditEnabled={isEditEnabled}
                        onEdit={handleEditContest}
                    />
                    <SubmissionTable
                        submissions={filteredSubmissions}
                        filterOptions={filterOptions}
                        onFilterChange={handleFilterChange}
                    />
                </div>
            </div>
        </div>
    );
}
