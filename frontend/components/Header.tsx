"use client"

import { signOut } from '@/lib/auth';
import { CodeIcon } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import React from 'react';

type Props = {};

function Header({}: Props) {
    const { data: session } = useSession();
    console.log(session);
    

    return (
        <header className='px-4 lg:px-6 h-14 flex items-center justify-between bg-primary text-primary-foreground'>
            <div className='w-[200px]'>
                <Link
                    href='/'
                    className='flex items-center w-6'
                    prefetch={false}
                >
                    <CodeIcon className='h-6 w-6 mx-auto' />
                    <span className='sr-only'>Contestify</span>
                </Link>
            </div>
            <nav className='flex gap-4 sm:gap-6'>
                <Link
                    href='/contests'
                    className='text-sm font-bold hover:underline underline-offset-4'
                    prefetch={false}
                >
                    Explore Contests
                </Link>
                <Link
                    href='#'
                    className='text-sm font-bold hover:underline underline-offset-4'
                    prefetch={false}
                >
                    Compete
                </Link>
                <Link
                    href='#'
                    className='text-sm font-bold hover:underline underline-offset-4'
                    prefetch={false}
                >
                    Leaderboard
                </Link>
            </nav>
            <nav className='flex gap-4 sm:gap-6'>
                {session?.user ? (
                    <Link
                        href='#'
                        className='inline-flex h-9 items-center justify-center rounded-md bg-primary-foreground px-4 py-2 text-sm font-medium text-primary shadow transition-colors hover:bg-gray-200'
                        prefetch={false}
                        onClick={(e) => {signOut()}}
                    >
                        Logout
                    </Link>
                ) : (
                    <>
                        <Link
                            href='/api/auth/signin'
                            className='inline-flex h-9 items-center justify-center rounded-md bg-primary-foreground px-4 py-2 text-sm font-medium text-primary shadow transition-colors hover:bg-gray-200'
                            prefetch={false}
                        >
                            Sign In
                        </Link>
                        <Link
                            href='/register'
                            className='inline-flex h-9 items-center justify-center rounded-md bg-primary-foreground px-4 py-2 text-sm font-medium text-primary shadow transition-colors hover:bg-gray-200'
                            prefetch={false}
                        >
                            Sign Up
                        </Link>
                    </>
                )}
            </nav>
        </header>
    );
}

export default Header;
