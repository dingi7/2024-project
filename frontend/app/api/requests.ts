import { ContestSubmission, User } from '@/lib/types';
import * as api from './api';

export const endpoints = {
    userSingIn: '/auth/signIn',
    codeSubmit: '/codeSubmit',
};

export const userSignIn = async (payload : User) => {
    return api.post(endpoints.userSingIn, payload);
};

export const codeSubmit = async (payload : ContestSubmission) => {
    return api.post(endpoints.codeSubmit, payload);
}