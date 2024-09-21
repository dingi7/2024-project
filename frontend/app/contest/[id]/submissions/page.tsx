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
import { Badge } from '@/components/ui/badge';

interface Submission {
  _id: number;
  problem_id: number;
  problem_title: string;
  status: string;
  score: number;
  language: string;
  createdat: string;
  ownerName: string;
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
        return new Date(b.createdat).getTime() - new Date(a.createdat).getTime();
    });

    const toggleSortOrder = () => {
        setSortOrder(prevOrder => prevOrder === 'desc' ? 'asc' : 'desc');
    };

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-2xl font-bold mb-4">All Submissions for {contest?.title}</h1>
            {loading ? (
                <p>Loading submissions...</p>
            ) : sortedSubmissions.length > 0 ? (
                <>
                    <div className="flex justify-between items-center mb-4">
                        <Button onClick={toggleSortOrder}>
                            Sort by Score: {sortOrder === 'desc' ? 'Highest First' : 'Lowest First'}
                        </Button>
                        <p>Total Submissions: {sortedSubmissions.length}</p>
                    </div>
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
                                    <TableCell>{new Date(submission.createdat).toLocaleString()}</TableCell>
                                    <TableCell>{submission.score !== null ? submission.score : '-'}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                submission.status === "pending" ? "outline" :
                                                submission.status ? 'success' : 'destructive'
                                            }
                                        >
                                            {submission.status === "pending" ? "Pending" :
                                             submission.status ? 'Passed' : 'Failed'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{submission.language}</TableCell>
                                    <TableCell>{submission.ownerName || 'Anonymous'}</TableCell>
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