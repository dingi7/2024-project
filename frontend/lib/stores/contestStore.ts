import { create } from 'zustand';
import { Contest, PlaceholderSubmission, Submission, TestCase } from '@/lib/types';
import { 
    codeSubmit, 
    createRepo, 
    editContest, 
    getContestById, 
    getSubmissionsByOwnerID 
} from '@/app/api/requests';
import { decodeBase64ToBlobUrl, reloadSession } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

export type FilterOptions = {
    status: "all" | "Passed" | "Failed" | "pending";
    sortBy: "date" | "score";
    order: "asc" | "desc";
};

interface ContestState {
    // Loading states
    loading: boolean;
    isEditEnabled: boolean;
    isCloning: boolean;
    
    // Contest data
    contest: Contest | null;
    isOwner: boolean;
    contestRulesBlobURL: string | null;
    
    // Submissions
    submissions: (Submission | PlaceholderSubmission)[];
    
    // GitHub repos
    repos: any[];
    selectedRepo: string;
    
    // Filters
    filterOptions: FilterOptions;
    
    // Actions
    setLoading: (loading: boolean) => void;
    setIsEditEnabled: (isEditEnabled: boolean) => void;
    setContest: (contest: Contest | null) => void;
    setIsOwner: (isOwner: boolean) => void;
    setContestRulesBlobURL: (url: string | null) => void;
    setSubmissions: (submissions: (Submission | PlaceholderSubmission)[]) => void;
    setRepos: (repos: any[]) => void;
    setSelectedRepo: (repo: string) => void;
    setFilterOptions: (options: FilterOptions) => void;
    setIsCloning: (isCloning: boolean) => void;
    updateTestCase: (testCase: TestCase, action: 'delete' | 'add' | 'edit') => void;
    
    // Complex actions
    fetchContestAndSubmissions: (contestId: string, userId: string, githubAccessToken?: string) => Promise<void>;
    handleEditContest: (updatedContest: Contest, contestId: string) => void;
    handleSubmit: (solution: { code: string; language: string }, contestId: string, userId: string) => Promise<void>;
    refreshGithubRepos: (githubAccessToken: string) => Promise<void>;
    handleCloneRepo: (contestId: string) => Promise<void>;
    
    // Computed properties
    getFilteredSubmissions: () => (Submission | PlaceholderSubmission)[];
    isContestActive: () => boolean;
}

export const useContestStore = create<ContestState>((set, get) => ({
    // Initial states
    loading: true,
    isEditEnabled: false,
    isCloning: false,
    contest: null,
    isOwner: false,
    contestRulesBlobURL: null,
    submissions: [],
    repos: [],
    selectedRepo: '',
    filterOptions: {
        status: "all",
        sortBy: "date",
        order: "desc",
    },
    
    // Basic setters
    setLoading: (loading) => set({ loading }),
    setIsEditEnabled: (isEditEnabled) => set({ isEditEnabled }),
    setContest: (contest) => set({ contest }),
    setIsOwner: (isOwner) => set({ isOwner }),
    setContestRulesBlobURL: (contestRulesBlobURL) => set({ contestRulesBlobURL }),
    setSubmissions: (submissions) => set({ submissions }),
    setRepos: (repos) => set({ repos }),
    setSelectedRepo: (selectedRepo) => set({ selectedRepo }),
    setFilterOptions: (filterOptions) => set({ filterOptions }),
    setIsCloning: (isCloning) => set({ isCloning }),
    
    updateTestCase: (testCase, action) => {
        set(state => {
            if (!state.contest) return state;
            
            let updatedTestCases;
            if (action === 'add') {
                // Check if testcase with this ID already exists
                const exists = state.contest.testCases.some(tc => tc.id === testCase.id);
                
                if (exists) {
                    // If exists, replace it (edit operation)
                    updatedTestCases = state.contest.testCases.map(tc => 
                        tc.id === testCase.id ? testCase : tc
                    );
                } else {
                    // If new, add it
                    updatedTestCases = [...state.contest.testCases, testCase];
                }
            } else if (action === 'delete') {
                // Remove the test case
                updatedTestCases = state.contest.testCases.filter(tc => tc.id !== testCase.id);
            } else if (action === 'edit') {
                // Direct edit operation without delete+add
                updatedTestCases = state.contest.testCases.map(tc => 
                    tc.id === testCase.id ? testCase : tc
                );
            } else {
                return state;
            }
            
            return {
                contest: {
                    ...state.contest,
                    testCases: updatedTestCases
                }
            };
        });
    },
    
    // Complex actions
    fetchContestAndSubmissions: async (contestId, userId, githubAccessToken) => {
        set({ loading: true });
        
        try {
            if (githubAccessToken) {
                get().refreshGithubRepos(githubAccessToken);
            }
            
            const contestResponse = await getContestById(contestId);
            const submissionsResponse = await getSubmissionsByOwnerID(
                contestId,
                userId
            );
            
            set({
                contest: contestResponse,
                isOwner: contestResponse.ownerID === userId,
                contestRulesBlobURL: contestResponse.contestRules
                    ? decodeBase64ToBlobUrl(contestResponse.contestRules)
                    : null,
                submissions: submissionsResponse,
            });
        } catch (error) {
            console.error('Failed to fetch contest or submissions:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch contest or submissions.',
                variant: 'destructive',
                duration: 2000,
            });
        } finally {
            set({ loading: false });
        }
    },
    
    handleEditContest: async (updatedContest, contestId) => {
        const currentContest = get().contest;
        
        set({ contest: updatedContest });
        
        try {
            await editContest(updatedContest, contestId);
            set({ isEditEnabled: false });
        } catch (error) {
            set({ contest: currentContest });
            console.error('Failed to edit contest:', error);
            toast({
                title: 'Error',
                description: 'Failed to edit contest.',
                variant: 'destructive',
                duration: 2000,
            });
        }
    },
    
    handleSubmit: async (solution, contestId, userId) => {
        const submission = {
            ...solution,
            contestId,
            ownerId: userId,
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
            isRepo: Boolean(get().selectedRepo)
        };

        try {
            set(state => ({
                submissions: [...state.submissions, placeholderSubmission]
            }));

            toast({
                title: 'Submission in Progress',
                description: 'Your code is being processed...',
                variant: 'default',
                duration: 3000,
            });

            const submissionResponse = await codeSubmit(
                submission,
                contestId,
                Boolean(get().selectedRepo)
            );
            
            console.log('Submission response received:', submissionResponse);

            if ('error' in submissionResponse) {
                throw new Error(
                    submissionResponse.message || submissionResponse.error
                );
            }

            set(state => ({
                submissions: state.submissions.map(sub => 
                    sub.id === placeholderSubmission.id ? submissionResponse : sub
                )
            }));

            toast({
                title: 'Submission Successful',
                description: 'Your code has been submitted successfully.',
                variant: 'success',
                duration: 2000,
            });
        } catch (error: any) {
            console.error('Submission failed:', error);

            set(state => ({
                submissions: state.submissions.map(sub => 
                    sub === placeholderSubmission
                        ? {
                            ...placeholderSubmission,
                            status: false,
                            error: error.message || 'Unknown error occurred',
                        }
                        : sub
                )
            }));

            toast({
                title: 'Submission Failed',
                description: error.message || 'An error occurred while submitting your code.',
                variant: 'destructive',
                duration: 3000,
            });
            throw error;
        }
    },
    
    refreshGithubRepos: async (githubAccessToken) => {
        reloadSession();
        await new Promise(resolve => setTimeout(resolve, 100));
        
        try {
            const response = await fetch('https://api.github.com/user/repos', {
                headers: {
                    Authorization: `Bearer ${githubAccessToken}`,
                },
                cache: 'no-store',
            });

            const data = await response.json();
            
            set(state => {
                if (JSON.stringify(state.repos) !== JSON.stringify(data)) {
                    return { repos: data };
                }
                return {};
            });
            
            console.log('Repos refreshed request sent:', data);
        } catch (error) {
            console.error('Error refreshing repos:', error);
        }
    },
    
    handleCloneRepo: async (contestId) => {
        const { contest } = get();
        if (!contest?.contestStructure) return;
        
        set({ isCloning: true });
        
        try {
            const response = await createRepo({
                templateCloneURL: contest.contestStructure,
                newRepoName: `contestify-${contest.title}`,
            });

            if (response.error || response.status === 500) {
                throw {
                    error: response.error || 'Repository Creation Failed',
                    details: response.details || 'Failed to create repository (already exists)',
                };
            }

            toast({
                title: 'Repository Created',
                description: 'The repository has been cloned successfully.',
                variant: 'success',
                duration: 2000,
            });

            // Add a delay to ensure GitHub API is updated
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Force a refresh of the repos with the next session update
            set({ selectedRepo: '' });
        } catch (error: any) {
            console.error('Failed to create repository:', error);
            let errorMessage = 'An error occurred while creating the repository.';

            if (error.details) {
                const details = error.details;
                if (details.includes('Repository name already exists')) {
                    errorMessage = 'A repository with this name already exists.';
                } else {
                    errorMessage = details;
                }
            }

            toast({
                title: error.error || 'Repository Creation Failed',
                description: errorMessage,
                variant: 'destructive',
                duration: 5000,
            });
        } finally {
            set({ isCloning: false });
        }
    },
    
    // Computed properties
    getFilteredSubmissions: () => {
        const { submissions, filterOptions } = get();
        
        if (!submissions || submissions.length === 0) {
            return [];
        }

        let filtered = [...submissions];
        
        if (filterOptions.status !== 'all') {
            filtered = filtered.filter(s => {
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
                    ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                    : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        } else if (filterOptions.sortBy === 'score') {
            filtered.sort((a, b) => 
                filterOptions.order === 'asc'
                    ? (a.score ?? 0) - (b.score ?? 0)
                    : (b.score ?? 0) - (a.score ?? 0)
            );
        }
        
        return filtered;
    },
    
    isContestActive: () => {
        const { contest } = get();
        if (!contest) return false;
        
        const now = new Date();
        const startDate = new Date(contest.startDate);
        const endDate = new Date(contest.endDate);
        
        return now >= startDate && now <= endDate;
    }
})); 