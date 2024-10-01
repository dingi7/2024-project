import { User } from '@/lib/types';
import NextAuth, { NextAuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import { userSignIn } from '../../requests';
import { refreshAccessToken } from '../../api';

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
                if (!result.accessToken || !result.refreshToken) {
                    console.error('Sign-in failed: Missing tokens in response');
                    return false;
                }

                user.accessToken = result.accessToken;
                user.refreshToken = result.refreshToken;
                return true;
            } catch (e) {
                console.error('SignIn error:', e);
                if (e instanceof Error) {
                    console.error('Error message:', e.message);
                    console.error('Error stack:', e.stack);
                }
                return false;
            }
        },
        async jwt({ token, account, user }) {
            if (user) {
                token.accessToken = user.accessToken;
                token.refreshToken = user.refreshToken;
                token.accessTokenExpires = Date.now() + 1000 * 60 * 60 * 24;
                token.id = user.id;
            } else if (account) {
                token.accessToken = account.access_token;
                token.refreshToken = account?.refresh_token;
                token.id = account.id;
            }
            if (Date.now() < (token.accessTokenExpires as number)) {
                return token
            }else{
                const newAccessToken = await refreshAccessToken(token.refreshToken as string);
                if (newAccessToken) {
                    token.accessToken = newAccessToken;
                    token.accessTokenExpires = Date.now() + 1000 * 60 * 60 * 24;
                }
            }
            return token;
        },
        async session({ session, token }) {
            session.user = {
                ...session.user,
                id: token.id as string,
            };
            session.accessToken = token.accessToken as string;
            return session;
        },
        
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
