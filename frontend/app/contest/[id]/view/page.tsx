'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TestCaseResult } from '@/lib/types';
import { CheckCircle2, XCircle } from 'lucide-react';
import { getSubmissionById } from '@/app/api/requests';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { useTranslation } from '@/lib/useTranslation';

const OutputComparison = ({ expected, received }: { expected: string, received: string }) => {
    const isMatch = expected === received;
    const { t } = useTranslation();
    
    return (
        <div className="space-y-2">
            <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">{t('testResults.expected')}:</span>
                <code className={`font-mono px-2 py-1 rounded ${isMatch ? 'bg-muted' : 'bg-red-100 dark:bg-red-900'}`}>
                    {expected}
                </code>
            </div>
            <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">{t('testResults.received')}:</span>
                <code className={`font-mono px-2 py-1 rounded ${isMatch ? 'bg-muted' : 'bg-red-100 dark:bg-red-900'}`}>
                    {received}
                </code>
            </div>
            {!isMatch && (
                <div className="text-xs text-red-600 dark:text-red-400">
                    {t('testResults.mismatch')}
                </div>
            )}
        </div>
    );
};

export default function TestCaseResultsPage() {
    const params = useParams<{ id: string }>();
    const { data: session } = useSession();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [testResults, setTestResults] = useState<TestCaseResult[]>([]);
    useEffect(() => {
        const fetchTestResults = async () => {
            if (!params.id || !session?.user?.id) return;
            
            try {
                setLoading(true);
                const response = await getSubmissionById(params.id);
                if (response.submission?.testCasesResults) {
                    setTestResults(response.submission.testCasesResults);
                }
            } catch (error) {
                console.error('Failed to fetch test results:', error);
                toast({
                    title: t('testResults.error.title'),
                    description: t('testResults.error.fetchFailed'),
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        };

        fetchTestResults();
    }, [params.id, session?.user?.id]);

    if (loading) {
        return (
            <div className="container mx-auto py-8">
                <Skeleton className="h-8 w-64 mb-6" />
                <Skeleton className="h-[200px] mb-8" />
                <Skeleton className="h-[400px]" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6">{t('testResults.title')}</h1>
            
            {/* Summary Card */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>{t('testResults.summary.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">{t('testResults.summary.totalTests')}</span>
                            <span className="text-2xl font-bold">{testResults.length}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">{t('testResults.summary.passed')}</span>
                            <span className="text-2xl font-bold text-green-600">
                                {testResults.filter(r => r.status).length}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">{t('testResults.summary.failed')}</span>
                            <span className="text-2xl font-bold text-red-600">
                                {testResults.filter(r => !r.status).length}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">{t('testResults.summary.successRate')}</span>
                            <span className="text-2xl font-bold">
                                {testResults.length > 0 
                                    ? Math.round((testResults.filter(r => r.status).length / testResults.length) * 100)
                                    : 0}%
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Detailed Results Table */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('testResults.details.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                    {testResults.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('testResults.details.status')}</TableHead>
                                    <TableHead>{t('testResults.details.input')}</TableHead>
                                    <TableHead className="w-1/3">{t('testResults.details.output')}</TableHead>
                                    <TableHead>{t('testResults.details.time')}</TableHead>
                                    <TableHead>{t('testResults.details.memory')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {testResults.map((result) => (
                                    <TableRow key={result.testCase.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {result.status ? (
                                                    <>
                                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                        <Badge variant="success">{t('testResults.status.passed')}</Badge>
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle className="h-5 w-5 text-red-600" />
                                                        <Badge variant="destructive">{t('testResults.status.failed')}</Badge>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <code className="font-mono bg-muted px-2 py-1 rounded">
                                                {result.testCase.input}
                                            </code>
                                        </TableCell>
                                        <TableCell>
                                            <OutputComparison 
                                                expected={result.testCase.output}
                                                received={result.SolutionOutput}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={result.time > result.testCase.timeLimit ? "destructive" : "outline"}>
                                                {result.time}ms
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={result.memoryUsage > result.testCase.memoryLimit ? "destructive" : "outline"}>
                                                {result.memoryUsage}MB
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            {t('testResults.noResults')}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}