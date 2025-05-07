'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCcwIcon } from 'lucide-react';

import ContestDetails from './components/ContestDetails';
import SubmissionForm from './components/SubmissionForm';
import SubmissionTable from './components/SubmissionTable';
import GithubRepos from './github/RepoList';
import TimeLocked from './components/TimeLocked';
import InvitationManager from './components/InvitationManager';

import { useContestStore } from '../../../lib/stores/contestStore';
import { useTranslation } from '@/lib/useTranslation';

// Import the FilterOptions type from store

export default function ContestPage() {
    const { t } = useTranslation();
    const { data: session, status } = useSession();
    const params = useParams<{ id: string }>();

    // Get all state and actions from the store
    const {
        loading,
        isEditEnabled,
        isCloning,
        contest,
        isOwner,
        contestRulesBlobURL,
        repos,
        selectedRepo,
        filterOptions,

        setIsEditEnabled,
        setSelectedRepo,
        setFilterOptions,

        fetchContestAndSubmissions,
        handleEditContest,
        handleSubmit,
        handleCloneRepo,
        refreshGithubRepos,

        getFilteredSubmissions,
        isContestActive,
    } = useContestStore();

    // Filtered submissions computed value
    const filteredSubmissions = getFilteredSubmissions();

    // Fetch contest data when component mounts or parameters change
    useEffect(() => {
        if (status === 'authenticated' && session?.user?.id) {
            fetchContestAndSubmissions(
                params?.id ?? '',
                session.user.id,
                session.githubAccessToken
            );
        }
    }, [params, session?.user?.id, status, fetchContestAndSubmissions, session?.githubAccessToken]);

    const handleRefresh = async () => {
        if (session?.user?.id) {
            await fetchContestAndSubmissions(
                params?.id ?? '',
                session.user.id,
                session.githubAccessToken
            );
        }
    };

    const handleSubmitWrapper = async (solution: {
        code: string;
        language: string;
    }) => {
        if (session?.user?.id) {
            await handleSubmit(solution, params?.id ?? '', session.user.id);
        }
    };

    const handleCloneRepoWrapper = async () => {
        if (session?.githubAccessToken) {
            await handleCloneRepo(params?.id ?? '');
            // After cloning, refresh the repos
            setTimeout(() => {
                refreshGithubRepos(session.githubAccessToken);
            }, 2000);
        }
    };

    const handleEditContestWrapper = (updatedContest: any) => {
        handleEditContest(updatedContest, params?.id ?? '');
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
                        {t('contestPage.notFound')}
                    </h1>
                </div>
            </div>
        );
    }

    if (!isContestActive()) {
        return (
            <TimeLocked
                startDate={contest.startDate}
                endDate={contest.endDate}
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
                        {contest.contestStructure != 'null' && (
                            <>
                                {!selectedRepo && (
                                    <Button
                                        disabled={isCloning}
                                        onClick={handleCloneRepoWrapper}
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
                                        onSubmit={handleSubmitWrapper}
                                        selectedRepo={
                                            selectedRepo
                                                ? repos.find(
                                                      (repo) =>
                                                          repo.name ===
                                                          selectedRepo
                                                  )
                                                : null
                                        }
                                        contestLanguage={contest.language}
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
                        {contest.contestStructure == 'null' && (
                            <SubmissionForm
                                onSubmit={handleSubmitWrapper}
                                selectedRepo={
                                    selectedRepo
                                        ? repos.find(
                                              (repo) =>
                                                  repo.name === selectedRepo
                                          )
                                        : null
                                }
                                contestLanguage={contest.language}
                            />
                        )}
                        <Button variant='outline' onClick={handleRefresh}>
                            <RefreshCcwIcon className='w-4 h-4 mr-2' />
                            {t('contestPage.buttons.refresh')}
                        </Button>
                        <Button variant={'outline'}>
                            <Link href={`/contest/${contest.id}/submissions`}>
                                {t('contestPage.buttons.allResults')}
                            </Link>
                        </Button>
                    </div>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
                    <div className='space-y-6'>
                        <ContestDetails
                            contest={contest}
                            setContest={useContestStore.getState().setContest}
                            isOwner={isOwner}
                            isEditEnabled={isEditEnabled}
                            setIsEditEnabled={setIsEditEnabled}
                            onEdit={handleEditContestWrapper}
                            contestRules={contestRulesBlobURL}
                        />
                        {isContestActive() && contest.inviteOnly && (
                            <InvitationManager
                                contestId={params?.id ?? ''}
                                isOwner={isOwner}
                            />
                        )}
                    </div>
                    <SubmissionTable
                        submissions={filteredSubmissions}
                        filterOptions={filterOptions}
                        onFilterChange={setFilterOptions}
                    />
                </div>
            </div>
        </div>
    );
}
