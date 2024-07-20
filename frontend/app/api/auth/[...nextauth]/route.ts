import NextAuth, { NextAuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';

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
            console.log('signIn', {
                user,
                account,
                profile,
                email,
                credentials,
            });

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
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
