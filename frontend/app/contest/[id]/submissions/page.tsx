'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getContestById, getSubmissions } from '@/app/api/requests';
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
} from "@/components/ui/table";

interface Submission {
  id: number;
  problem_id: number;
  problem_title: string;
  status: string;
  score: number;
  language: string;
  createdAt: string;
}

export default function AllSubmissionsPage() {
    const [loading, setLoading] = useState(true);
    const [contest, setContest] = useState<any>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const params = useParams<{ id: string }>();

    useEffect(() => {
        fetchContestAndSubmissions();
    }, [params.id]);

    const fetchContestAndSubmissions = async () => {
        try {
            setLoading(true);
            const [contestResponse, submissionsResponse] = await Promise.all([
                getContestById(params.id),
                getSubmissions(params.id)
            ]);
            setContest(contestResponse);
            setSubmissions(Array.isArray(submissionsResponse) ? submissionsResponse : []);
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

    const sortedSubmissions = [...submissions].sort((a, b) => {
        if (a.score !== b.score) {
            return sortOrder === 'desc' ? b.score - a.score : a.score - b.score;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const toggleSortOrder = () => {
        setSortOrder(prevOrder => prevOrder === 'desc' ? 'asc' : 'desc');
    };

    if (loading) {
        return (
            <div className='container mx-auto py-8 px-4 md:px-6'>
                <Skeleton className='w-full h-[500px]' />
            </div>
        );
    }

    if (!contest) {
        return (
            <div className='container mx-auto py-8 px-4 md:px-6'>
                <h1 className='text-2xl font-bold mb-4'>Contest not found</h1>
            </div>
        );
    }

    return (
        <div className='container mx-auto py-8 px-4 md:px-6'>
            <div className='flex items-center justify-between mb-6'>
                <h1 className='text-2xl font-bold'>All Submissions for {contest?.title || 'Contest'}</h1>
                <Link href={`/contest/${params.id}`} passHref>
                    <Button variant='outline'>Back to Contest</Button>
                </Link>
            </div>
            {sortedSubmissions.length > 0 ? (
                <>
                    <Button onClick={toggleSortOrder} className="mb-4">
                        Sort by Score: {sortOrder === 'desc' ? 'Highest First' : 'Lowest First'}
                    </Button>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Score</TableHead>
                                <TableHead>Language</TableHead>
                                <TableHead>Submitted At</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedSubmissions.map((submission) => (
                                <TableRow key={submission.id}>
                                    <TableCell>{submission.id}</TableCell>
                                    <TableCell>{submission.score}</TableCell>
                                    <TableCell>{submission.language}</TableCell>
                                    <TableCell>{new Date(submission.createdAt).toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </>
            ) : (
                <p>No submissions found for this contest.</p>
            )}
        </div>
    );
}