import { ContestSubmission, User } from '@/lib/types';
import * as api from './api';

export const endpoints = {
    userSingIn: '/auth/signIn',
    codeSubmit: '/codeSubmit',
    getContests: '/contest',
    createContest: '/contest',
    getContestById: (id: string) => `/contest/${id}`,
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