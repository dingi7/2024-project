"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  session?: any; // Optional: Pass the session if fetched on the server
}

const SessionProvider = ({ children, session }: Props) => {
  return (
    <NextAuthSessionProvider
      session={session}
      refetchOnWindowFocus={true} // Refresh session when window is refocused
      refetchInterval={5 * 60} // Optional: Refresh session every 5 minutes
    >
      {children}
    </NextAuthSessionProvider>
  );
};

export default SessionProvider;
