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
    id: string;
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
    // testCase: TestCase;
    id: string;
    input: string;
    passed: boolean;
    solutionOutput: string;
    expectedOutput: string;
    memoryUsage: number;
    time: number;
    memoryUsageLimit: number;
    timeLimit: number;
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
    contestStructure: string | null;
}

export type Submission = {
    id: string;
    contestID: string;
    userID: string;
    code: string;
    status: boolean;
    score: number;
    createdAt: string;
    language: string;
    isRepo: boolean;
    testCasesResults: TestCaseResult[];
    totalTestCases: number;
    passedTestCases: number;
}

export type PlaceholderSubmission = {
    id: string;
    contestID: string;
    userID: string;
    code: string;
    status: boolean;
    score: number | null;
    createdAt: string;
    language: string;
    isRepo: boolean;
    testCasesResults?: TestCaseResult[];
    totalTestCases?: number;
    passedTestCases?: number;
}

export interface Invitation {
    id: string;
    contestID: string;
    userID: string;
    userEmail?: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
    updatedAt: string;
    contest?: Contest;
    user?: {
        id: string;
        name: string;
        email: string;
        image: string;
    };
}