'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';

export default function ContestPage() {
    // const router = useRouter();
    const pathname = usePathname();
    const id = pathname.split('/').pop();

    const [isOwner, setIsOwner] = useState(true);
    const [isEditEnabled, setIsEditEnabled] = useState(false);
    const [contest, setContest] = useState({
        title: 'Code Challenge: Optimize Sorting Algorithm',
        description:
            'Design and implement an optimized sorting algorithm that can handle large datasets efficiently.',
        startDate: '2023-06-01',
        endDate: '2023-06-30',
        prize: '$5,000',
    });
    const [submissions, setSubmissions] = useState([
        {
            id: 1,
            date: '2023-06-15',
            status: 'Accepted',
            score: 95,
        },
        {
            id: 2,
            date: '2023-06-20',
            status: 'Rejected',
            score: 80,
        },
        {
            id: 3,
            date: '2023-06-25',
            status: 'Pending',
            score: null,
        },
    ]);
    const [filterOptions, setFilterOptions] = useState({
        status: 'all',
        sortBy: 'date',
        order: 'desc',
    });
    const handleSubmit = (solution: any) => {
        setSubmissions([
            ...submissions,
            {
                id: submissions.length + 1,
                date: new Date().toISOString().slice(0, 10),
                status: 'Pending',
                score: null,
            },
        ]);
    };
    const handleEditContest = (updatedContest: any) => {
        setContest(updatedContest);
    };
    const filteredSubmissions = useMemo(() => {
        let filtered = submissions;
        if (filterOptions.status !== 'all') {
            filtered = filtered.filter(
                (s) => s.status === filterOptions.status
            );
        }
        if (filterOptions.sortBy === 'date') {
            filtered = filtered.sort((a, b) =>
                filterOptions.order === 'asc'
                    ? new Date(a.date).getTime() - new Date(b.date).getTime()
                    : new Date(b.date).getTime() - new Date(a.date).getTime()
            );
        } else if (filterOptions.sortBy === 'score') {
            filtered = filtered.sort((a, b) =>
                filterOptions.order === 'asc'
                    ? (a.score ?? 0) - (b.score ?? 0)
                    : (b.score ?? 0) - (a.score ?? 0)
            );
        }
        return filtered;
    }, [submissions, filterOptions]);
    const handleRefresh = () => {
        const updatedSubmissions = submissions.map((submission) => {
            if (submission.status === 'Pending') {
                return {
                    ...submission,
                    status: 'Accepted',
                    score: Math.floor(Math.random() * 100),
                };
            }
            return submission;
        });
        setSubmissions(updatedSubmissions);
    };
    return (
        <>
            <Header />
            <div className='container mx-auto py-8 px-4 md:px-6'>
                <div className='flex items-center justify-between mb-6'>
                    <h1 className='text-2xl font-bold'>Code Challenge</h1>
                    <div className='flex gap-2'>
                        <Button variant='outline'>View Submissions</Button>
                        <Button onClick={handleSubmit}>
                            Submit New Solution
                        </Button>
                        {isOwner && (
                            <Button
                                onClick={() => setIsEditEnabled(!isEditEnabled)}
                            >
                                Edit Contest
                            </Button>
                        )}
                        <Button variant='outline' onClick={handleRefresh}>
                            <RefreshCcwIcon className='w-4 h-4 mr-2' />
                            Refresh
                        </Button>
                    </div>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
                    <div>
                        <h1 className='text-2xl font-bold mb-4'>
                            {contest.title}
                        </h1>
                        <p className='text-muted-foreground mb-4'>
                            {contest.description}
                        </p>
                        <div className='grid grid-cols-2 gap-4 mb-4'>
                            <div>
                                <h3 className='text-sm font-medium mb-1'>
                                    Start Date
                                </h3>
                                <p>{contest.startDate}</p>
                            </div>
                            <div>
                                <h3 className='text-sm font-medium mb-1'>
                                    End Date
                                </h3>
                                <p>{contest.endDate}</p>
                            </div>
                            <div>
                                <h3 className='text-sm font-medium mb-1'>
                                    Prize
                                </h3>
                                <p>{contest.prize}</p>
                            </div>
                        </div>
                        {isOwner && isEditEnabled && (
                            <div className='mt-8'>
                                <h2 className='text-lg font-medium mb-4'>
                                    Edit Contest
                                </h2>
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleEditContest({
                                            ...contest,
                                            title: 'Updated Contest Title',
                                            description:
                                                'Updated contest description',
                                        });
                                    }}
                                >
                                    <div className='grid grid-cols-2 gap-4 mb-4'>
                                        <div>
                                            <Label htmlFor='title'>Title</Label>
                                            <Input
                                                id='title'
                                                defaultValue={contest.title}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor='description'>
                                                Description
                                            </Label>
                                            <Textarea
                                                id='description'
                                                defaultValue={
                                                    contest.description
                                                }
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className='grid grid-cols-2 gap-4 mb-4'>
                                        <div>
                                            <Label htmlFor='startDate'>
                                                Start Date
                                            </Label>
                                            <Input
                                                id='startDate'
                                                type='date'
                                                defaultValue={contest.startDate}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor='endDate'>
                                                End Date
                                            </Label>
                                            <Input
                                                id='endDate'
                                                type='date'
                                                defaultValue={contest.endDate}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor='prize'>Prize</Label>
                                        <Input
                                            id='prize'
                                            defaultValue={contest.prize}
                                            required
                                        />
                                    </div>
                                    <Button type='submit' className='mt-4'>
                                        Save Changes
                                    </Button>
                                </form>
                            </div>
                        )}
                    </div>
                    <div>
                        <h2 className='text-lg font-medium mb-4'>
                            Your Submissions
                        </h2>
                        <div className='mb-4'>
                            <Label htmlFor='status' className='mr-2'>
                                Filter by status:
                            </Label>
                            <Select
                                value={filterOptions.status}
                                onValueChange={(value) =>
                                    setFilterOptions({
                                        ...filterOptions,
                                        status: value,
                                    })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder='All' />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='all'>All</SelectItem>
                                    <SelectItem value='Accepted'>
                                        Accepted
                                    </SelectItem>
                                    <SelectItem value='Rejected'>
                                        Rejected
                                    </SelectItem>
                                    <SelectItem value='Pending'>
                                        Pending
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className='mb-4'>
                            <Label htmlFor='sortBy' className='mr-2'>
                                Sort by:
                            </Label>
                            <Select
                                value={filterOptions.sortBy}
                                onValueChange={(value) =>
                                    setFilterOptions({
                                        ...filterOptions,
                                        sortBy: value,
                                    })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder='Date' />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='date'>Date</SelectItem>
                                    <SelectItem value='score'>Score</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select
                                value={filterOptions.order}
                                onValueChange={(value) =>
                                    setFilterOptions({
                                        ...filterOptions,
                                        order: value,
                                    })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder='Descending' />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='asc'>
                                        Ascending
                                    </SelectItem>
                                    <SelectItem value='desc'>
                                        Descending
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Score</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSubmissions.map((submission) => (
                                    <TableRow key={submission.id}>
                                        <TableCell>{submission.date}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    submission.status ===
                                                    'Accepted'
                                                        ? 'outline'
                                                        : submission.status ===
                                                          'Rejected'
                                                        ? 'destructive'
                                                        : 'secondary'
                                                }
                                            >
                                                {submission.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {submission.score !== null
                                                ? submission.score
                                                : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </>
    );
}

function RefreshCcwIcon(props: any) {
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
            <path d='M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8' />
            <path d='M3 3v5h5' />
            <path d='M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16' />
            <path d='M16 16h5v5' />
        </svg>
    );
}
