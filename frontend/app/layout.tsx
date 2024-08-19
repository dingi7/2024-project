import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth";

import SessionProvider from "@/components/SessionProvider";

import { cn } from "@/lib/utils";
import Footer from "@/components/Footer";
import Header from "@/components/header/Header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Contestify",
  description:
    "Revolutionize your coding competitions with Contestify! Our platform allows organizers to effortlessly create, manage, and automate code contests, providing a seamless environment for testing and verifying competitors' solutions. Experience hassle-free submissions and accurate, real-time evaluations with Contestify.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();

  return (
    <html lang="en">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange>
          <SessionProvider session={session}>
            <main className="flex min-h-screen flex-col">
              <Header />
              {children}
              <Toaster />
              <Footer />
            </main>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
