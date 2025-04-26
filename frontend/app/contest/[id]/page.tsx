'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { RefreshCcwIcon } from 'lucide-react';

import ContestDetails from './components/ContestDetails';
import SubmissionForm from './components/SubmissionForm';
import SubmissionTable from './components/SubmissionTable';
import GithubRepos from './github/repoList';
import { TimeLocked } from './components/TimeLocked';

import {
    codeSubmit,
    createRepo,
    editContest,
    getContestById,
    getSubmissionsByOwnerID,
} from '@/app/api/requests';
import { decodeBase64ToBlobUrl, reloadSession } from '@/lib/utils';
import { useTranslation } from '@/lib/useTranslation';

import { Contest, PlaceholderSubmission, Submission } from '@/lib/types';
import InvitationManager from './components/InvitationManager';

type FilterOptions = {
    status: "all" | "Passed" | "Failed" | "pending";
    sortBy: "date" | "score";
    order: "asc" | "desc";
};

export default function ContestPage() {
    const { t } = useTranslation();
    let { data: session, status } = useSession();
    const params = useParams<{ id: string }>();

    const [loading, setLoading] = useState(true);
    const [isEditEnabled, setIsEditEnabled] = useState(false);

    const [contestState, setContestState] = useState({
        contest: null as Contest | null,
        isOwner: false,
        isEditEnabled: false,
        contestRulesBlobURL: null as string | null,
    });
    const [submissions, setSubmissions] = useState<
        Submission[] | PlaceholderSubmission[]
    >([]);
    const [repos, setRepos] = useState<any[]>([]);

    const [filterOptions, setFilterOptions] = useState<FilterOptions>({
        status: "all",
        sortBy: "date",
        order: "desc",
    });

    const [selectedRepo, setSelectedRepo] = useState<string>('');
    const [isCloning, setIsCloning] = useState(false);

    const refreshGithubRepos = async () => {
        reloadSession();
        await new Promise((resolve) => setTimeout(resolve, 100));
        if (!session?.githubAccessToken) {
            reloadSession();
        }
        try {
            const response = await fetch('https://api.github.com/user/repos', {
                headers: {
                    Authorization: `Bearer ${session!.githubAccessToken}`,
                },
                cache: 'no-store',
            });

            const data = await response.json();
            setRepos((prevRepos) => {
                if (JSON.stringify(prevRepos) !== JSON.stringify(data)) {
                    return data;
                }
                return prevRepos;
            });
            console.log('Repos refreshed request sent:', data);
        } catch (error) {
            console.error('Error refreshing repos:', error);
        }
    };

    // check user session

    const fetchContestAndSubmissions = async () => {
        refreshGithubRepos();
        try {
            const contestResponse = await getContestById(params?.id ?? '');
            const submissionsResponse = await getSubmissionsByOwnerID(
                params?.id ?? '',
                session?.user?.id ?? ''
            );

            setContestState((prev) => ({
                ...prev,
                isOwner: contestResponse.ownerID === session?.user?.id,
                contest: contestResponse,
                contestRulesBlobURL: contestResponse.contestRules
                    ? decodeBase64ToBlobUrl(contestResponse.contestRules)
                    : null,
            }));
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
    }, [params, session?.user?.id, status]);

    const handleEditContest = (updatedContest: Contest) => {
        const currentContest = contestState.contest;
        setContestState((prev) => ({
            ...prev,
            contest: updatedContest,
        }));
        try {
            editContest(updatedContest, params?.id ?? '');
        } catch (error) {
            setContestState((prev) => ({
                ...prev,
                contest: currentContest,
            }));
            console.error('Failed to edit contest:', error);
            toast({
                title: 'Error',
                description: 'Failed to edit contest.',
                variant: 'destructive',
                duration: 2000,
            });
        }
        setIsEditEnabled(false);
    };

    const handleFilterChange = (filters: FilterOptions) => {
        setFilterOptions(filters);
    };

    const handleSubmit = async (solution: {
        code: string;
        language: string;
    }) => {
        const submission = {
            ...solution,
            contestId: params?.id ?? '',
            ownerId: session?.user?.id ?? '',
            _id: 'placeholder',
        };

        const placeholderSubmission: PlaceholderSubmission = {
            id: submission._id,
            contestID: submission.contestId,
            userID: submission.ownerId,
            code: submission.code,
            language: submission.language,
            status: false,
            score: null,
            createdAt: new Date().toISOString(),
            isRepo: false
        };

        try {
            setSubmissions((prevSubmissions) => {
                if (Array.isArray(prevSubmissions)) {
                    return [
                        ...prevSubmissions,
                        placeholderSubmission,
                    ] as PlaceholderSubmission[];
                }
                return [placeholderSubmission];
            });

            toast({
                title: t('contestPage.submission.inProgress'),
                description: t('contestPage.submission.inProgressDesc'),
                variant: 'default',
                duration: 3000,
            });

            const submissionResponse = await codeSubmit(
                submission,
                params?.id ?? '',
                selectedRepo ? true : false
            );
            // log the submissionResponse
            console.log('Submission response received:', submissionResponse);
            

            if ('error' in submissionResponse) {
                throw new Error(
                    submissionResponse.message || submissionResponse.error
                );
            }

            setSubmissions((prevSubmissions) => {
                if (Array.isArray(prevSubmissions)) {
                    return prevSubmissions.map((sub) =>
                        sub.id === placeholderSubmission.id ? submissionResponse : sub
                    ) as Submission[] | PlaceholderSubmission[];
                }
                return [submissionResponse];
            });

            toast({
                title: t('contestPage.submission.success'),
                description: t('contestPage.submission.successDesc'),
                variant: 'success',
                duration: 2000,
            });
        } catch (error: any) {
            console.error('Submission failed:', error);

            setSubmissions((prevSubmissions) => {
                if (Array.isArray(prevSubmissions)) {
                    return prevSubmissions.map((sub) =>
                        sub === placeholderSubmission
                            ? {
                                  ...placeholderSubmission,
                                  status: false,
                                  error:
                                      error.message || 'Unknown error occurred',
                              }
                            : sub
                    ) as PlaceholderSubmission[];
                }
                return [];
            });

            toast({
                title: t('contestPage.submission.failed'),
                description:
                    error.message || t('contestPage.submission.failedDesc'),
                variant: 'destructive',
                duration: 3000,
            });
            throw error;
        }
    };

    const filteredSubmissions = useMemo(() => {
        if (!submissions || submissions.length === 0) {
            return [] as Submission[]; // Explicitly type the empty array
        }

        let filtered = [...submissions] as (
            | Submission
            | PlaceholderSubmission
        )[];
        if (filterOptions.status !== 'all') {
            filtered = filtered.filter((s) => {
                if (filterOptions.status === 'Passed') {
                    return s.status === true;
                } else if (filterOptions.status === 'Failed') {
                    return s.status === false;
                } else if (filterOptions.status === 'pending') {
                    return s.score === null;
                }
                return true;
            });
        }
        if (filterOptions.sortBy === 'date') {
            filtered.sort((a, b) =>
                filterOptions.order === 'asc'
                    ? new Date(a.createdAt).getTime() -
                      new Date(b.createdAt).getTime()
                    : new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime()
            );
        } else if (filterOptions.sortBy === 'score') {
            filtered.sort((a, b) =>
                filterOptions.order === 'asc'
                    ? (a.score ?? 0) - (b.score ?? 0)
                    : (b.score ?? 0) - (a.score ?? 0)
            );
        }
        return filtered as Submission[]; // Cast the final result
    }, [submissions, filterOptions]);

    const handleRefresh = async () => {
        setLoading(true);
        await fetchContestAndSubmissions();
    };

    const isContestActive = useMemo(() => {
        if (!contestState.contest) return false;
        const now = new Date();
        const startDate = new Date(contestState.contest.startDate);
        const endDate = new Date(contestState.contest.endDate);
        return now >= startDate && now <= endDate;
    }, [contestState.contest]);

    const handleCloneRepo = async () => {
        if (!contestState.contest?.contestStructure) return;
        
        setIsCloning(true);
        try {
            const response = await createRepo({
                templateCloneURL: contestState.contest.contestStructure,
                newRepoName: `contestify-${contestState.contest.title}`,
            });

            if (response.error || response.status === 500) {
                throw {
                    error: response.error || 'Repository Creation Failed',
                    details:
                        response.details ||
                        'Failed to create repository (already exists)',
                };
            }

            toast({
                title: t('contestPage.repo.success'),
                description: t('contestPage.repo.successDesc'),
                variant: 'success',
                duration: 2000,
            });

            // Add a slightly longer delay to ensure GitHub API is updated
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Force a refresh of the repos
            await refreshGithubRepos();
            // Force rerender of GithubRepos by temporarily clearing selectedRepo
            setSelectedRepo('');
        } catch (error: any) {
            console.error('Failed to create repository:', error);
            let errorMessage = t('contestPage.repo.failedDesc');

            if (error.details) {
                const details = error.details;
                if (details.includes('Repository name already exists')) {
                    errorMessage = t('contestPage.repo.alreadyExists');
                } else {
                    errorMessage = details;
                }
            }

            toast({
                title: error.error || t('contestPage.repo.failed'),
                description: errorMessage,
                variant: 'destructive',
                duration: 5000,
            });
        } finally {
            setIsCloning(false);
        }
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

    if (!contestState.contest) {
        return (
            <div className='flex flex-col flex-1'>
                <div className='container mx-auto py-8 px-4 md:px-6'>
                    <h1 className='text-2xl font-bold mb-4'>
                        {t('contestPage.notFound')}
                    </h1>
                </div>
            </div>
        );
    }

    if (!isContestActive) {
        return (
            <TimeLocked
                startDate={contestState.contest!.startDate}
                endDate={contestState.contest!.endDate}
            />
        );
    }
    return (
        <div className='flex flex-col flex-1'>
            <div className='container mx-auto py-8 px-4 md:px-6'>
                <div className='flex items-center justify-between mb-6'>
                    <h1 className='text-2xl font-bold'>
                        {t('contestPage.title')}
                    </h1>
                    <div className='flex gap-2'>
                        {contestState.contest.contestStructure != "null" && (
                            <>
                                {!selectedRepo && (
                                    <Button
                                        disabled={isCloning}
                                        onClick={handleCloneRepo}
                                    >
                                        {isCloning ? (
                                            <>
                                                <RefreshCcwIcon className='w-4 h-4 mr-2 animate-spin' />
                                                {t(
                                                    'contestPage.buttons.cloning'
                                                )}
                                            </>
                                        ) : (
                                            t(
                                                'contestPage.buttons.cloneStructure'
                                            )
                                        )}
                                    </Button>
                                )}
                                {selectedRepo && (
                                    <SubmissionForm
                                        onSubmit={handleSubmit}
                                        selectedRepo={
                                            selectedRepo
                                                ? repos.find(
                                                      (repo) =>
                                                          repo.name ===
                                                          selectedRepo
                                                  )
                                                : null
                                        }
                                    />
                                )}
                                <GithubRepos
                                    key={`repos-${repos.length}`}
                                    repos={repos}
                                    selectedRepo={selectedRepo}
                                    setSelectedRepo={setSelectedRepo}
                                />
                            </>
                        )}
                        {contestState.contest.contestStructure == "null" &&(
                            <SubmissionForm
                                onSubmit={handleSubmit}
                                selectedRepo={
                                    selectedRepo
                                        ? repos.find(
                                              (repo) =>
                                                  repo.name === selectedRepo
                                          )
                                        : null
                                }
                            />
                        )}
                        <Button variant='outline' onClick={handleRefresh}>
                            <RefreshCcwIcon className='w-4 h-4 mr-2' />
                            {t('contestPage.buttons.refresh')}
                        </Button>
                        <Button variant={'outline'}>
                            <Link
                                href={`/contest/${
                                    contestState.contest!.id
                                }/submissions`}
                            >
                                {t('contestPage.buttons.allResults')}
                            </Link>
                        </Button>
                    </div>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
                    <div className="space-y-6">
                        <ContestDetails
                            contest={contestState.contest!}
                            setContest={(contest) =>
                                setContestState((prev) => ({
                                    ...prev,
                                    contest: contest,
                                }))
                            }
                            isOwner={contestState.isOwner}
                            isEditEnabled={isEditEnabled}
                            setIsEditEnabled={setIsEditEnabled}
                            onEdit={handleEditContest}
                            contestRules={contestState.contestRulesBlobURL}
                        />
                        {isContestActive && (
                            <InvitationManager 
                                contestId={params?.id ?? ''}
                                isOwner={contestState.isOwner}
                            />
                        )}
                    </div>
                    <SubmissionTable
                        submissions={filteredSubmissions}
                        filterOptions={filterOptions as FilterOptions}
                        onFilterChange={(filter) =>
                            handleFilterChange(filter as FilterOptions)
                        }
                    />
                </div>
            </div>
        </div>
    );
}
