import { User } from '@/lib/types';
import NextAuth, { NextAuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import { userSignIn } from '../../requests';

const authOptions: NextAuthOptions = {
    // Add this console.log statement
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
            if (user) {
                return {
                    ...token,
                    accessToken: user.accessToken,
                    id: user.id,
                };
            }
            return token;
        },
        async session({ session, token }) {
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
