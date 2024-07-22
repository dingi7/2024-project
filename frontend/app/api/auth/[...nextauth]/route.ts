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
        async signIn({ user, account, profile, email, credentials }) {
            // This callback runs every time a user signs in
            // send account.access_token to the API and save the token
            const serverPayload: User = {
                provider: account?.provider,
                id: user.id,
                email: user.email?.toLowerCase(),
                name: user.name,
                image: user.image,
                accessToken: account?.access_token,
            };
            try {
                const result = await userSignIn(serverPayload);
                account!.access_token = result.accessToken;
                console.log('result', result);
                return true;
            } catch (e) {
                console.error('error', e);
                return false;
            }

            // // account?.access_token = getTokenFromServer(serverPayload);

            // console.log('signIn', {
            //     user,
            //     account,
            //     profile,
            //     email,
            //     credentials,
            // });

            const isAllowedToSignIn = true;
            if (isAllowedToSignIn) {
                return true;
            } else {
                // Return false to display a default error message
                return false;
                // Or you can return a URL to redirect to:
                // return '/unauthorized'
            }
        },
        async jwt({ token, account }) {
            if (account?.access_token) {
                token.accessToken = account.access_token as string;
            }
            return token;
        },
        async session({ session, token, user }) {
            session.accessToken = token.accessToken as string | undefined;
            session.user = user;
            return session;
        },
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
