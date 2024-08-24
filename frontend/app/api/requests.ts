import { ContestSubmission, User } from '@/lib/types';
import * as api from './api';

export const endpoints = {
    userSingIn: '/auth/signIn',
    codeSubmit: '/codeSubmit',
    getContests: '/contest',
    createContest: '/contest',
    addTestCase: (id: string) => `/contest/${id}/TestCases`,
    getContestById: (id: string) => `/contest/${id}`,
    deleteContest: (id: string) => `/contest/${id}`,
};

export const userSignIn = async (payload : User) => {
    return api.post(endpoints.userSingIn, payload);
};

export const codeSubmit = async (payload : ContestSubmission) => {
    return api.post(endpoints.codeSubmit, payload);
}

export const getContests = async () => {
    return api.get(endpoints.getContests);
}

export const createContest = async (payload : any) => {
    return api.post(endpoints.createContest, payload);
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