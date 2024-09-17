import NextAuth from "next-auth";
import { DefaultSession, DefaultJWT, DefaultUser } from "next-auth";

declare module "next-auth" {
    interface Session extends DefaultSession {
        accessToken: string;
        user: {
            id: string;
        } & DefaultSession["user"];
    }

    interface JWT extends DefaultJWT {
        accessToken: string;
    }

    interface User extends DefaultUser {
        accessToken: string;
    }
}
