import { ContestSubmission, User } from '@/lib/types';
import * as api from './api';

export const endpoints = {
    userSingIn: '/auth/signIn',
    getContests: '/contest',
    createContest: '/contest',
    codeSubmit: (id: string) => `/codeSubmit/${id}`,
    addTestCase: (id: string) => `/contest/${id}/TestCases`,
    deleteTestCase: (contestId: string, testCaseId: string) => `/contest/${contestId}/TestCases/${testCaseId}`,
    getContestById: (id: string) => `/contest/${id}`,
    deleteContest: (id: string) => `/contest/${id}`,
    getSubmissions: (id: string) => `/submissions/${id}`,
    getLeaderboard: '/leaderboard',
};

export const userSignIn = async (payload : User) => {
    return api.post(endpoints.userSingIn, payload);
};

export const codeSubmit = async (payload : ContestSubmission, id: string) => {
    return api.post(endpoints.codeSubmit(id), payload);
}

export const getContests = async () => {
    return api.get(endpoints.getContests);
}

export const createContest = async (payload : any) => {
    return api.post(endpoints.createContest, payload, true);
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

export const getSubmissions = async (contestId: string) => {
    return api.get(endpoints.getSubmissions(contestId));
}

export const deleteTestCase = async (contestId: string, testCaseId: string) => {
    return api.del(endpoints.deleteTestCase(contestId, testCaseId));
}

export const getLeaderboard = async () => {
    return api.get(endpoints.getLeaderboard);
}