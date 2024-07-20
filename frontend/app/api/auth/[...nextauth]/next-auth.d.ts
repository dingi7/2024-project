import NextAuth from 'next-auth';
import { DefaultSession, DefaultJWT } from 'next-auth';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    accessToken?: string;
  }

  interface JWT extends DefaultJWT {
    accessToken?: string;
  }
}
