import { User } from '@/lib/types';
import NextAuth, { NextAuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import { userSignIn } from '../../requests';

export const authOptions: NextAuthOptions = {
    providers: [
        GitHubProvider({
            clientId: process.env.GITHUB_ID ?? '',
            clientSecret: process.env.GITHUB_SECRET ?? '',
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
            console.log('payload', serverPayload);

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
                };
            }
            console.log('jwt', { token, account, user });
            return token;
        },
        async session({ session, token }) {
            session.user = {
                name: token.name,
                email: token.email,
                image: token.picture,
            };
            session.accessToken = token.accessToken as string;
            console.log('session', { session, token });
            return session;
        },
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
