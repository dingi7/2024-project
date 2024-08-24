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

export interface ContestSubmission {
    id: string | undefined;
    ownerId: string
    code: string;
    language: string;
}

export interface TestCase {
    id: number;
    input: string;
    output: string;
    timeLimit: string;
}

export interface Contest {
    id: string;
    title: string;
    description: string;
    languages: string[];
    category: string;
    startDate: string;
    endDate: string;
    prize: number;
    ownerId: string;
    testCases: TestCase[];
}