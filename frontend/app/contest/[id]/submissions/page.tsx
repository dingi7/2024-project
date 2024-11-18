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
import { useTranslation } from '@/lib/useTranslation';

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
    const { t } = useTranslation();
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
            // Sort by status true first
            return b.status ? 1 : a.status ? -1 : 0;
        }
        return 0; // Default case
    });

    return (
        <div className='container mx-auto py-8 flex-1'>
            <div className='rounded-lg p-6'>
                <h1 className='text-3xl font-bold mb-6'>
                    {t('submissionsPage.title')} {contest?.title}
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
                                    <SelectValue placeholder={t('submissionsPage.sortBy.label')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='score'>{t('submissionsPage.sortBy.score')}</SelectItem>
                                    <SelectItem value='date'>{t('submissionsPage.sortBy.date')}</SelectItem>
                                    <SelectItem value='status'>{t('submissionsPage.sortBy.status')}</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className='text-sm'>
                                {t('submissionsPage.totalSubmissions')}: {sortedSubmissions.length}
                            </p>
                        </div>
                        <div className='overflow-x-auto'>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('submissionsPage.table.submissionDate')}</TableHead>
                                        <TableHead>{t('submissionsPage.table.score')}</TableHead>
                                        <TableHead>{t('submissionsPage.table.status')}</TableHead>
                                        <TableHead>{t('submissionsPage.table.language')}</TableHead>
                                        <TableHead>{t('submissionsPage.table.user')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedSubmissions.map((submission) => (
                                        <TableRow key={submission._id}>
                                            <TableCell>
                                                {new Date(submission.createdAt).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                {submission.score !== null ? submission.score : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        submission.status === 'pending'
                                                            ? 'outline'
                                                            : submission.status
                                                            ? 'success'
                                                            : 'destructive'
                                                    }
                                                >
                                                    {submission.status === 'pending'
                                                        ? t('submissionsPage.status.pending')
                                                        : submission.status
                                                        ? t('submissionsPage.status.passed')
                                                        : t('submissionsPage.status.failed')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{submission.language}</TableCell>
                                            <TableCell>
                                                {submission.ownerName || t('submissionsPage.status.anonymous')}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </>
                ) : (
                    <p className='text-center py-8'>{t('submissionsPage.noSubmissions')}</p>
                )}
            </div>
        </div>
    );
}
