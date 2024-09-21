'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcwIcon } from 'lucide-react';
import ContestDetails from './components/ContestDetails';
import SubmissionForm from './components/SubmissionForm';
import SubmissionTable from './components/SubmissionTable';
import { getSession, useSession } from 'next-auth/react';
import {
    codeSubmit,
    editContest,
    getContestById,
    getSubmissions,
} from '@/app/api/requests';
import { useParams } from 'next/navigation';
import { Contest } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { decodeBase64ToBlobUrl } from '@/lib/utils';

export default function ContestPage() {
    let { data: session, status } = useSession();
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

    const [contestRules, setContestRules] = useState<string | null>(null);

    useEffect(() => {
        if (!session?.user.id) {
            getSession().then((updatedSession: any) => {
                session = updatedSession;
            });
        }
        if (status === 'unauthenticated' || !session || !session.user.id)
            return;
    }, [status]);

    const fetchContestAndSubmissions = async () => {
        try {
            const contestResponse = await getContestById(params.id);
            setContest(contestResponse);
            setIsOwner(contestResponse.ownerID === session?.user?.id);
            if (contestResponse.contestRules) {
                const blobUrl = decodeBase64ToBlobUrl(
                    contestResponse.contestRules
                );
                setContestRules(blobUrl);
            }
            const submissionsResponse = await getSubmissions(params.id);
            setSubmissions(submissionsResponse);
        } catch (error) {
            console.error('Failed to fetch contest or submissions:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch contest or submissions.',
                variant: 'destructive',
                duration: 2000,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContestAndSubmissions();
    }, [params, session]);

    const handleEditContest = (updatedContest: any) => {
        const currentContest = contest;
        setContest(updatedContest);
        try {
            editContest(updatedContest, params.id);
        } catch (error) {
            setContest(currentContest);
            console.error('Failed to edit contest:', error);
            toast({
                title: 'Error',
                description: 'Failed to edit contest.',
                variant: 'destructive',
                duration: 2000,
            });
        }
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

        const placeholderSubmission = {
            ...submission,
            status: 'pending',
            score: null,
            createdAt: new Date().toISOString(),
        };

        try {
            setSubmissions([...submissions, placeholderSubmission]);
            toast({
                title: 'Submission successful',
                description:
                    'Your code has been submitted successfully. Please wait for the results.',
                variant: 'success',
                duration: 1000,
            });
            const submissionResponse = await codeSubmit(submission, params.id);
            setSubmissions((prevSubmissions) =>
                prevSubmissions
                    ? prevSubmissions.map((sub) =>
                          sub === placeholderSubmission
                              ? submissionResponse
                              : sub
                      )
                    : [submissionResponse]
            );
        } catch (error) {
            setSubmissions((prevSubmissions) =>
                prevSubmissions
                    ? prevSubmissions.map((sub) =>
                          sub === placeholderSubmission
                              ? { ...sub, status: 'error' }
                              : sub
                      )
                    : [{ ...placeholderSubmission, status: 'error' }]
            );
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
        setLoading(true);
        await fetchContestAndSubmissions();
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
                        setContest={setContest}
                        isOwner={isOwner}
                        isEditEnabled={isEditEnabled}
                        setIsEditEnabled={setIsEditEnabled}
                        onEdit={handleEditContest}
                        contestRules={contestRules}
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
