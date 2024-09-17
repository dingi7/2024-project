import { User } from '@/lib/types';
import NextAuth, { NextAuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import { userSignIn } from '../../requests';

const authOptions: NextAuthOptions = {
    providers: [
        GitHubProvider({
            clientId: (() => {
                const clientId = process.env.ENVIRONMENT === 'production'
                    ? process.env.GITHUB_PRODUCTION_ID ?? ''
                    : process.env.GITHUB_DEVELOPMENT_ID ?? '';
                console.log('GitHub OAuth ClientID:', clientId);
                return clientId;
            })(),
            clientSecret: (() => {
                const clientSecret = process.env.ENVIRONMENT === 'production'
                    ? process.env.GITHUB_PRODUCTION_SECRET ?? ''
                    : process.env.GITHUB_DEVELOPMENT_SECRET ?? '';
                console.log('GitHub OAuth ClientSecret:', clientSecret);
                return clientSecret;
            })(),
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            const serverPayload: User = {
                provider: account?.provider,
                id: user.id,
                email: user.email?.toLowerCase(),
                name: user.name,
                image: user.image,
                GitHubAccessToken: account?.access_token,
            };

            try {
                const result = await userSignIn(serverPayload);
                user.accessToken = result.accessToken;
                return true;
            } catch (e: any) {
                console.log('error', e.error);
                return false;
            }
        },
        async jwt({ token, account, user }) {
            console.log("User data:", user);
            if (user) {
                return {
                    ...token,
                    accessToken: user.accessToken,
                    id: user.id,
                };
            }
            if (account) {
                return {
                    ...token,
                    accessToken: account.access_token,
                    id: account.id,
                };
            }
            return token;
        },
        async session({ session, token }) {
            console.log("Session data:", session);
            console.log("Token data:", token);
            session.user = {
                id: token.id as string,
                name: token.name,
                email: token.email,
                image: token.picture,
            };
            session.accessToken = token.accessToken as string;
            return session;
        },
        
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
