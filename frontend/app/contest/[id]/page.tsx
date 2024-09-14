'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcwIcon } from 'lucide-react';
import ContestDetails from './components/ContestDetails';
import SubmissionForm from './components/SubmissionForm';
import SubmissionTable from './components/SubmissionTable';
import { useSession } from 'next-auth/react';
import { codeSubmit, getContestById, getSubmissions } from '@/app/api/requests';
import { useParams } from 'next/navigation';
import { Contest } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';

export default function ContestPage() {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const params = useParams<{ id: string }>();
    const [isOwner, setIsOwner] = useState(false);
    const [isEditEnabled, setIsEditEnabled] = useState(false);
    const [contest, setContest] = useState<Contest | null>(null);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [filterOptions, setFilterOptions] = useState({
        status: 'all',
        sortBy: 'date',
        order: 'desc',
    });

    useEffect(() => {
        const fetchContestAndSubmissions = async () => {
            try {
                const contestResponse = await getContestById(params.id);
                setContest(contestResponse);
                setIsOwner(contestResponse.ownerID === session?.user?.id);

                const submissionsResponse = await getSubmissions(params.id);
                setSubmissions(submissionsResponse);
            } catch (error) {
                console.error('Failed to fetch contest or submissions:', error);
                // Handle error (e.g., show error message to user)
            } finally {
                setLoading(false);
            }
        };
        fetchContestAndSubmissions();
    }, [params, session]);

    const handleEditContest = (updatedContest: any) => {
        setContest(updatedContest);
    };

    const handleFilterChange = (filters: any) => {
        setFilterOptions(filters);
    };

    const handleSubmit = async (solution: any) => {
        const submission = {
            ...solution,
            contestId: params.id,
            userId: session?.user?.id,
        };
        try {
            const submissionResponse = await codeSubmit(submission, params.id);
            toast({
                title: 'Submission successful',
                description: 'Your code has been submitted successfully.',
                variant: 'success',
                duration: 2000,
            });

            setSubmissions([...submissions, submissionResponse]);
        } catch (error) {

            console.error('Submission failed:', error);
            toast({
                title: 'Submission failed',
                description:
                    'There was an error submitting your code. Please try again.',
                variant: 'destructive',
                duration: 2000,
            });
        }
    };

    const filteredSubmissions = useMemo(() => {
        if (!submissions || submissions.length === 0) {
            return [];
        }

        let filtered = [...submissions];
        if (filterOptions.status !== 'all') {
            filtered = filtered.filter(
                (s) => s.status === filterOptions.status
            );
        }
        if (filterOptions.sortBy === 'date') {
            filtered.sort((a, b) =>
                filterOptions.order === 'asc'
                    ? new Date(a.date).getTime() - new Date(b.date).getTime()
                    : new Date(b.date).getTime() - new Date(a.date).getTime()
            );
        } else if (filterOptions.sortBy === 'score') {
            filtered.sort((a, b) =>
                filterOptions.order === 'asc'
                    ? (a.score ?? 0) - (b.score ?? 0)
                    : (b.score ?? 0) - (a.score ?? 0)
            );
        }
        return filtered;
    }, [submissions, filterOptions]);

    const handleRefresh = async () => {
        const updatedSubmissions = await getSubmissions(params.id);
        setSubmissions(updatedSubmissions);
    };

    if (loading) {
        return (
            <div className='flex flex-col flex-1'>
                <div className='container mx-auto py-8 px-4 md:px-6 flex-row flex gap-5'>
                    <Skeleton className='w-[50%] h-[300px] mb-4' />
                    <Skeleton className='w-[50%] h-[500px]' />
                </div>
            </div>
        );
    }

    if (!contest) {
        return (
            <div className='flex flex-col flex-1'>
                <div className='container mx-auto py-8 px-4 md:px-6'>
                    <h1 className='text-2xl font-bold mb-4'>
                        Contest not found
                    </h1>
                </div>
            </div>
        );
    }
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
                        contest={contest!}
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
