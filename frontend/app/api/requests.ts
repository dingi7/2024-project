import { ContestSubmission, User } from '@/lib/types';
import * as api from './api';

export const endpoints = {
    userSingIn: '/auth/signIn',
//   registerUser: '/auth/register',
//   joinOrg: (orgId: string) => `/auth/joinOrg/${orgId}`,

};

export const userSignIn = async (payload : User) => {
    return api.post(endpoints.userSingIn, payload);
};

export const codeSubmit = async (payload : ContestSubmission) => {
    return api.post('/codeSubmit', payload);
}