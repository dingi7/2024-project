import NextAuth from 'next-auth';
import { DefaultSession, DefaultJWT, DefaultUser } from 'next-auth';

declare module 'next-auth' {
    interface Session extends DefaultSession {
        accessToken: string;
        refreshToken: string;
        githubAccessToken: string;
        user: {
            id: string;
        } & DefaultSession['user'];
    }

    interface JWT extends DefaultJWT {
        accessToken: string;
        refreshToken: string;
        accessTokenExpires: number;
        githubAccessToken: string;
        id: string;
    }

    interface User extends DefaultUser {
        accessToken: string;
        refreshToken: string;
        githubAccessToken: string;
        id: string;
    }
}
