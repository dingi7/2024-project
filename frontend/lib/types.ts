export interface ContestFilters {
    category: string | null;
    startDate: string | null;
    endDate: string | null;
    prizeAmount: string | null;
}

export interface User {
    provider: string | undefined;
    id: string | undefined;
    email: string | undefined | null;
    name: string | undefined | null;
    image: string | undefined | null;
    GitHubAccessToken: string | undefined;
}
