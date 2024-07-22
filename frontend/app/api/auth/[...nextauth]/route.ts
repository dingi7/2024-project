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
                console.log('serverPayload', serverPayload);
                
                const result = await userSignIn(serverPayload);
                user.accessToken = result.accessToken;
                console.log('result', result);
                return true;
            } catch (e : any) {
                console.log('error', e.error);
                console.table('error', e);

                return true;
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
        async jwt({ token, account, user }) {
            // Initial sign in
            if ( user) {
              return {
                ...token,
                accessToken: user.accessToken,
                // userId: user.id,
                // userEmail: user.email,
                // userName: user.name,
                // userImage: user.image,
              }
            }
            console.log('jwt', { token, account, user });
            // Return previous token if the access token has not expired yet
            return token
          },
          async session({ session, token }) {
            session.user = {
              name: token.name,
              email: token.email,
              image: token.picture,
            }
            session.accessToken = token.accessToken as string
            console.log('session', { session, token });
            return session
          },
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
