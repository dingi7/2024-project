import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { JSX, SVGProps } from 'react';

export default function Component() {
    return (
        <div className='mx-auto max-w-sm rounded-lg shadow-lg bg-gray-100 dark:bg-gray-900 p-6 space-y-6 border border-gray-200 dark:border-gray-700'>
            <div className='space-y-2 text-center'>
                <h1 className='text-3xl font-bold'>Login</h1>
                <p className='text-zinc-500 dark:text-zinc-400'>
                    Enter your email below to login to your account
                </p>
            </div>
            <div className='space-y-4'>
                <div className='space-y-2'>
                    <Label htmlFor='email'>Email</Label>
                    <Input
                        id='email'
                        placeholder='m@example.com'
                        required
                        type='email'
                    />
                </div>
                <div className='flex items-center space-x-2'>
                    <hr className='flex-grow border-zinc-200 dark:border-zinc-700' />
                    <span className='text-zinc-400 dark:text-zinc-300 text-sm'>
                        OR
                    </span>
                    <hr className='flex-grow border-zinc-200 dark:border-zinc-700' />
                </div>
                <Button
                    className='w-full bg-[#4285F4] text-white'
                    variant='outline'
                >
                    <div className='flex items-center justify-center'>
                        <ChromeIcon className='w-5 h-5 mr-2' />
                        Login with Google
                    </div>
                </Button>
            </div>
        </div>
    );
}

function ChromeIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns='http://www.w3.org/2000/svg'
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        >
            <circle cx='12' cy='12' r='10' />
            <circle cx='12' cy='12' r='4' />
            <line x1='21.17' x2='12' y1='8' y2='8' />
            <line x1='3.95' x2='8.54' y1='6.06' y2='14' />
            <line x1='10.88' x2='15.46' y1='21.94' y2='14' />
        </svg>
    );
}
