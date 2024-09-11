
import { User } from '@/lib/types';
import NextAuth, { NextAuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import { userSignIn } from '../../requests';

const authOptions: NextAuthOptions = {
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
