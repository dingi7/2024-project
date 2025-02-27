export interface ContestFilters {
    language: string | null;
    startDate: string | null;
    endDate: string | null;
    prize: string | null;
}

export interface User {
    provider: string | undefined;
    id: string | undefined;
    email: string | undefined | null;
    name: string | undefined | null;
    image: string | undefined | null;
    GitHubAccessToken: string | undefined;
}

export interface ContestSolution {
    _id: string | null;
    ownerId: string
    code: string;
    language: string;
    contestId: string;
}

export interface TestCase {
    id: number;
    input: string;
    output: string;
    timeLimit: number;
    public: boolean;
    memoryLimit: number;
}

export interface TestCaseWithResult extends TestCase {
    _id: {
        $oid: string;
    };
}

export interface TestCaseResult {
    testcase: TestCaseWithResult;
    passed: boolean;
    solutionoutput: string;
    memoryusage: number;
    time: number;
}

export interface Contest {
    id: string;
    title: string;
    description: string;
    // languages: string[];
    language: string;
    category: string;
    startDate: string;
    endDate: string;
    prize: number;
    ownerId: string;
    testCases: TestCase[];
    createdAt: string;
    contestRules: string;
    contestStructure: string;
}

export type Submission = {
    id: string;
    contestId: string;
    createdAt: string;
    language: string;
    ownerName: string;
    ownerEmail: string;
    ownerId: string;
    score: number;
    status: boolean;
    error?: string;
    message?: string;
    testCaseResults?: TestCaseResult[];
}

export type PlaceholderSubmission = {
    id: string;
    contestId: string;
    language: string;
    ownerId: string;
    score: number | null;
    status: string | boolean;
    createdAt: string;
    error?: string;
    message?: string;
    testCaseResults?: TestCaseResult[];
}