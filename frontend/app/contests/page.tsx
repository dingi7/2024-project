/**
 * v0 by Vercel.
 * @see https://v0.dev/t/pIIb89vXFgn
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Header from '../Components/Header';

export default function Component() {
    return (
        <div className='w-full'>
            <Header />
            <section className='bg-background py-12 md:py-16 lg:py-20'>
                <div className='container mx-auto px-4 md:px-6'>
                    <div className='max-w-3xl'>
                        <h1 className='text-3xl font-bold tracking-tight md:text-4xl'>
                            Explore Exciting Contests
                        </h1>
                        <p className='mt-4 text-muted-foreground md:text-xl'>
                            Browse through a variety of contests and find the
                            perfect one to showcase your talents.
                        </p>
                    </div>
                </div>
            </section>
            <section className='container mx-auto px-4 md:px-6 py-8 md:py-12'>
                <div className='flex flex-col md:flex-row items-start gap-8'>
                    <div className='flex flex-col gap-6 md:w-1/4'>
                        <div className='grid gap-2'>
                            <label
                                htmlFor='category'
                                className='text-sm font-medium'
                            >
                                Category
                            </label>
                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder='Select category' />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='art'>Art</SelectItem>
                                    <SelectItem value='design'>
                                        Design
                                    </SelectItem>
                                    <SelectItem value='photography'>
                                        Photography
                                    </SelectItem>
                                    <SelectItem value='writing'>
                                        Writing
                                    </SelectItem>
                                    <SelectItem value='music'>Music</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className='grid gap-2'>
                            <label
                                htmlFor='start-date'
                                className='text-sm font-medium'
                            >
                                Start Date
                            </label>
                            <Input type='date' id='start-date' />
                        </div>
                        <div className='grid gap-2'>
                            <label
                                htmlFor='end-date'
                                className='text-sm font-medium'
                            >
                                End Date
                            </label>
                            <Input type='date' id='end-date' />
                        </div>
                        <div className='grid gap-2'>
                            <label
                                htmlFor='prize-amount'
                                className='text-sm font-medium'
                            >
                                Prize Amount
                            </label>
                            <Input
                                type='number'
                                id='prize-amount'
                                placeholder='$0'
                            />
                        </div>
                    </div>
                    <div className='flex-1'>
                        <div className='flex items-center gap-4 mb-6'>
                            <Input
                                type='search'
                                placeholder='Search contests...'
                                className='flex-1'
                            />
                            <Button>Search</Button>
                        </div>
                        <div className='grid gap-6'>
                            <div className='grid gap-4'>
                                <div className='flex items-center gap-4 bg-background p-4 rounded-lg shadow-sm'>
                                    <div className='flex-1'>
                                        <h3 className='text-lg font-semibold'>
                                            Creative Logo Design Contest
                                        </h3>
                                        <p className='text-muted-foreground'>
                                            Design a unique and memorable logo
                                            for our company.
                                        </p>
                                    </div>
                                    <Link
                                        href='#'
                                        className='inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'
                                        prefetch={false}
                                    >
                                        More Info
                                    </Link>
                                </div>
                                <div className='flex items-center gap-4 bg-background p-4 rounded-lg shadow-sm'>
                                    <div className='flex-1'>
                                        <h3 className='text-lg font-semibold'>
                                            Photography Contest: Capture the
                                            Essence of Nature
                                        </h3>
                                        <p className='text-muted-foreground'>
                                            Submit your best nature-inspired
                                            photographs.
                                        </p>
                                    </div>
                                    <Link
                                        href='#'
                                        className='inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'
                                        prefetch={false}
                                    >
                                        More Info
                                    </Link>
                                </div>
                                <div className='flex items-center gap-4 bg-background p-4 rounded-lg shadow-sm'>
                                    <div className='flex-1'>
                                        <h3 className='text-lg font-semibold'>
                                            Short Story Writing Competition
                                        </h3>
                                        <p className='text-muted-foreground'>
                                            Showcase your storytelling skills
                                            and win big.
                                        </p>
                                    </div>
                                    <Link
                                        href='#'
                                        className='inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'
                                        prefetch={false}
                                    >
                                        More Info
                                    </Link>
                                </div>
                            </div>
                            <div className='grid gap-4'>
                                <div className='flex items-center gap-4 bg-background p-4 rounded-lg shadow-sm'>
                                    <div className='flex-1'>
                                        <h3 className='text-lg font-semibold'>
                                            Graphic Design Challenge: Redesign
                                            Our Website
                                        </h3>
                                        <p className='text-muted-foreground'>
                                            Revamp our website with a fresh,
                                            modern design.
                                        </p>
                                    </div>
                                    <Link
                                        href='#'
                                        className='inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'
                                        prefetch={false}
                                    >
                                        More Info
                                    </Link>
                                </div>
                                <div className='flex items-center gap-4 bg-background p-4 rounded-lg shadow-sm'>
                                    <div className='flex-1'>
                                        <h3 className='text-lg font-semibold'>
                                            Musical Composition Contest
                                        </h3>
                                        <p className='text-muted-foreground'>
                                            Create an original musical
                                            composition in any genre.
                                        </p>
                                    </div>
                                    <Link
                                        href='#'
                                        className='inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'
                                        prefetch={false}
                                    >
                                        More Info
                                    </Link>
                                </div>
                                <div className='flex items-center gap-4 bg-background p-4 rounded-lg shadow-sm'>
                                    <div className='flex-1'>
                                        <h3 className='text-lg font-semibold'>
                                            Poetry Slam: Express Yourself
                                        </h3>
                                        <p className='text-muted-foreground'>
                                            Share your poetic talents and
                                            compete for the grand prize.
                                        </p>
                                    </div>
                                    <Link
                                        href='#'
                                        className='inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'
                                        prefetch={false}
                                    >
                                        More Info
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
