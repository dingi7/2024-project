import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Contest from './components/contest';
import Header from '@/components/Header';

const contests = [
    {
        name: 'Creative Logo Design Contest',
        description: 'Design a unique and memorable logo for our company.',
        link: '#',
    },
    {
        name: 'Photography Contest: Capture the Essence of Nature',
        description: 'Submit your best nature-inspired photographs.',
        link: '#',
    },
    {
        name: 'Short Story Writing Competition',
        description: 'Showcase your storytelling skills and win big.',
        link: '#',
    },
    {
        name: 'Graphic Design Challenge: Redesign Our Website',
        description: 'Revamp our website with a fresh, modern design.',
        link: '#',
    },
];

export default function ContestPage() {
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
                                {contests.map(({ name, description, link }) => (
                                    <Contest
                                        name={name}
                                        description={description}
                                        link={link}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
