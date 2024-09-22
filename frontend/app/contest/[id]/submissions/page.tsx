'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getContestById, getSubmissionsByContestID } from '@/app/api/requests';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select'; // Import Select components
import { Contest } from '@/lib/types';

interface Submission {
    _id: number;
    problem_id: number;
    problem_title: string;
    status: string;
    score: number;
    language: string;
    createdAt: string;
    ownerName: string;
}

export default function AllSubmissionsPage() {
    const [loading, setLoading] = useState(true);
    const [contest, setContest] = useState<Contest | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [sortOrder, setSortOrder] = useState<'score' | 'date' | 'status'>(
        'score'
    );
    const params = useParams<{ id: string }>();

    const fetchContestAndSubmissions = async () => {
        try {
            setLoading(true);
            const [contestResponse, submissionsResponse] = await Promise.all([
                getContestById(params.id),
                getSubmissionsByContestID(params.id)
            ]);
            setContest(contestResponse);
            setSubmissions(
                Array.isArray(submissionsResponse) ? submissionsResponse : []
            );
        } catch (error) {
            console.error('Failed to fetch contest or submissions:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch contest or submissions.',
                variant: 'destructive',
                duration: 2000,
            });
            setSubmissions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContestAndSubmissions();
    }, [params.id]);

    const handleSortChange = (value: 'score' | 'date' | 'status') => {
        setSortOrder(value);
    };

    const sortedSubmissions = [...submissions].sort((a, b) => {
        if (sortOrder === 'score') {
            return b.score - a.score; // Sort by score descending
        } else if (sortOrder === 'date') {
            return (
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            ); // Sort by date descending
        } else if (sortOrder === 'status') {
            // Convert status to a comparable value
            const statusOrder = { pending: 0, success: 1, failed: 2 };
            const aStatus =
                statusOrder[a.status as keyof typeof statusOrder] ?? 3;
            const bStatus =
                statusOrder[b.status as keyof typeof statusOrder] ?? 3;
            return aStatus - bStatus;
        }
        return 0; // Default case
    });

    return (
        <div className='container mx-auto py-8 flex-1'>
            <div className='rounded-lg p-6'>
                <h1 className='text-3xl font-bold mb-6'>
                    All Submissions for {contest?.title}
                </h1>
                {loading ? (
                    <div className='flex justify-center items-center h-64'>
                        <Skeleton className='h-8 w-8 rounded-full' />
                        <Skeleton className='h-8 w-8 rounded-full ml-4' />
                        <Skeleton className='h-8 w-8 rounded-full ml-4' />
                    </div>
                ) : sortedSubmissions.length > 0 ? (
                    <>
                        <div className='flex justify-between items-center mb-6'>
                            <Select onValueChange={handleSortChange}>
                                <SelectTrigger className='w-[180px]'>
                                    <SelectValue placeholder='Sort by' />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='score'>Score</SelectItem>
                                    <SelectItem value='date'>
                                        Submission Date
                                    </SelectItem>
                                    <SelectItem value='status'>
                                        Status
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <p className='text-sm'>
                                Total Submissions: {sortedSubmissions.length}
                            </p>
                        </div>
                        <div className='overflow-x-auto'>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Submission Date</TableHead>
                                        <TableHead>Score</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Language</TableHead>
                                        <TableHead>User</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedSubmissions.map((submission) => (
                                        <TableRow key={submission._id}>
                                            <TableCell>
                                                {new Date(
                                                    submission.createdAt
                                                ).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                {submission.score !== null
                                                    ? submission.score
                                                    : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        submission.status ===
                                                        'pending'
                                                            ? 'outline'
                                                            : submission.status
                                                            ? 'success'
                                                            : 'destructive'
                                                    }
                                                >
                                                    {submission.status ===
                                                    'pending'
                                                        ? 'Pending'
                                                        : submission.status
                                                        ? 'Passed'
                                                        : 'Failed'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {submission.language}
                                            </TableCell>
                                            <TableCell>
                                                {submission.ownerName ||
                                                    'Anonymous'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </>
                ) : (
                    <p className='text-center py-8'>
                        No submissions found for this contest.
                    </p>
                )}
            </div>
        </div>
    );
}
