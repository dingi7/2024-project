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
import { Contest } from '@/lib/types';
import { useTranslation } from '@/lib/useTranslation';
import { Input } from '@/components/ui/input';

interface Submission {
    _id: number;
    problem_id: number;
    problem_title: string;
    status: string;
    score: number;
    createdAt: string;
    ownerName: string;
}

export default function AllSubmissionsPage() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [contest, setContest] = useState<Contest | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    console.log(submissions);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<{
        key: 'createdAt' | 'score' | 'status' | 'ownerName';
        direction: 'asc' | 'desc';
    }>({ key: 'createdAt', direction: 'desc' });
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

    const handleSort = (key: typeof sortConfig.key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const sortedAndFilteredSubmissions = [...submissions]
        .filter((submission) => {
            if (!searchQuery) return true;
            const searchLower = searchQuery.toLowerCase();
            return (
                (submission.problem_title?.toLowerCase() || '').includes(searchLower) ||
                (submission.ownerName?.toLowerCase() || '').includes(searchLower)
            );
        })
        .sort((a, b) => {
            const direction = sortConfig.direction === 'asc' ? 1 : -1;
            
            switch (sortConfig.key) {
                case 'createdAt':
                    return direction * (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                case 'score':
                    return direction * ((b.score ?? 0) - (a.score ?? 0));
                case 'status':
                    return direction * (b.status ? 1 : a.status ? -1 : 0);
                case 'ownerName':
                    return direction * ((a.ownerName || '').localeCompare(b.ownerName || ''));
                default:
                    return 0;
            }
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
                ) : sortedAndFilteredSubmissions.length > 0 ? (
                    <>
                        <div className='flex justify-between items-center mb-6 gap-4'>
                            <div className='flex items-center gap-4 flex-1'>
                                <Input
                                    type="text"
                                    placeholder={t('submissionsPage.searchPlaceholder') || "Search submissions..."}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="max-w-xs"
                                />
                            </div>
                            <p className='text-sm'>
                                {t('submissionsPage.totalSubmissions')}: {sortedAndFilteredSubmissions.length}
                            </p>
                        </div>
                        <div className='overflow-x-auto'>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead 
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleSort('createdAt')}
                                        >
                                            {t('submissionsPage.table.submissionDate')}
                                            {sortConfig.key === 'createdAt' && (
                                                <span className="ml-2">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                            )}
                                        </TableHead>
                                        <TableHead 
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleSort('score')}
                                        >
                                            {t('submissionsPage.table.score')}
                                            {sortConfig.key === 'score' && (
                                                <span className="ml-2">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                            )}
                                        </TableHead>
                                        <TableHead 
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleSort('status')}
                                        >
                                            {t('submissionsPage.table.status')}
                                            {sortConfig.key === 'status' && (
                                                <span className="ml-2">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                            )}
                                        </TableHead>
                                        <TableHead 
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleSort('ownerName')}
                                        >
                                            {t('submissionsPage.table.user')}
                                            {sortConfig.key === 'ownerName' && (
                                                <span className="ml-2">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                            )}
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedAndFilteredSubmissions.map((submission) => (
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
