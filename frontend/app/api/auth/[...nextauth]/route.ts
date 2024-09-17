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
                console.log('SignIn callback - user:', user);
                return true;
            } catch (e: any) {
                console.error('SignIn error:', e);
                return false;
            }
        },
        async jwt({ token, account, user }) {
            console.log("JWT callback - input:", { token, account, user });
            if (user) {
                token.accessToken = user.accessToken;
                token.id = user.id;
            } else if (account) {
                token.accessToken = account.access_token;
                token.id = account.id;
            }
            console.log("JWT callback - output token:", token);
            return token;
        },
        async session({ session, token }) {
            console.log("Session callback - input:", { session, token });
            session.user = {
                ...session.user,
                id: token.id as string,
            };
            session.accessToken = token.accessToken as string;
            console.log("Session callback - output session:", session);
            return session;
        },
        
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
