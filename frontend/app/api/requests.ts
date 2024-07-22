import { User } from '@/lib/types';
import * as api from './api';

export const endpoints = {
    userSingIn: '/auth/signIn',
//   registerUser: '/auth/register',
//   joinOrg: (orgId: string) => `/auth/joinOrg/${orgId}`,

};

export const userSignIn = async (payload : User) => {
    return api.post(endpoints.userSingIn, payload);
};

