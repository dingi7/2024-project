import type { Metadata } from 'next';
import { Inter as FontSans } from 'next/font/google';
import './globals.css';

import { cn } from '@/lib/utils';

const fontSans = FontSans({
    subsets: ['latin'],
    variable: '--font-sans',
});

export const metadata: Metadata = {
    title: 'Contestify',
    description:
        "Revolutionize your coding competitions with Contestify! Our platform allows organizers to effortlessly create, manage, and automate code contests, providing a seamless environment for testing and verifying competitors' solutions. Experience hassle-free submissions and accurate, real-time evaluations with Contestify.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang='en'>
            <body
                className={cn(
                    'min-h-screen bg-background font-sans antialiased',
                    fontSans.variable
                )}
            >
                {children}
            </body>
        </html>
    );
}
