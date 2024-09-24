import { Contest, ContestSolution, TestCase, User } from '@/lib/types';
import * as api from './api';

export const endpoints = {
    userSingIn: '/auth/signIn',
    getContests: '/contest',
    createContest: '/contest',
    codeSubmit: (id: string) => `/codeSubmit/${id}`,
    addTestCase: (id: string) => `/contest/${id}/TestCases`,
    editTestCase: (id: string) => `/contest/${id}/TestCases`,
    deleteTestCase: (contestId: string, testCaseId: string) => `/contest/${contestId}/TestCases/${testCaseId}`,
    getContestById: (id: string) => `/contest/${id}`,
    deleteContest: (id: string) => `/contest/${id}`,
    getSubmissionsByContestID: (contestId: string) => `/submissions/${contestId}`,
    getSubmissionsByOwnerID: (contestId: string, ownerId: string) => `/submissions/${contestId}/${ownerId}`,
    getLeaderboard: '/leaderboard',
    editContest: (id: string) => `/contest/${id}`,
};

export const userSignIn = async (payload : User) => {
    return api.post(endpoints.userSingIn, payload);
};

export const codeSubmit = async (payload : ContestSolution, id: string) => {
    return api.post(endpoints.codeSubmit(id), payload);
}

export const getContests = async () => {
    return api.get(endpoints.getContests);
}

export const createContest = async (payload : {
    title: string,
    description: string,
    language: string,
    startDate: Date,
    endDate: Date,
    prize: number,
    ownerId: string,
    contestRules: any,
}) => {
    return api.post(endpoints.createContest, payload, true);
}

export const editContest = async (payload : Contest, id: string) => {
    return api.put(endpoints.editContest(id), payload, true);
}

export const getContestById = async (id: string) => {
    return api.get(endpoints.getContestById(id));
}

export const deleteContest = async (id: string) => {
    return api.del(endpoints.deleteContest(id));
}

export const addTestCase = async (id: string, payload : any) => {
    return api.post(endpoints.addTestCase(id), payload);
}

export const editTestCase = async (id: string, payload : TestCase) => {
    return api.put(endpoints.editTestCase(id), payload);
}

export const getSubmissionsByContestID = async (contestId: string) => {
    return api.get(endpoints.getSubmissionsByContestID(contestId));
}

export const getSubmissionsByOwnerID = async (contestId: string, ownerId: string) => {
    return api.get(endpoints.getSubmissionsByOwnerID(contestId, ownerId));
}

export const deleteTestCase = async (contestId: string, testCaseId: string) => {
    return api.del(endpoints.deleteTestCase(contestId, testCaseId));
}

export const getLeaderboard = async () => {
    return api.get(endpoints.getLeaderboard);
}