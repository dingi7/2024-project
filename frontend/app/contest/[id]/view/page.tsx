'use client';

import React, { useEffect, useState } from 'react';
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
import { CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { getSubmissionById } from '@/app/api/requests';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { useTranslation } from '@/lib/useTranslation';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CodeBlock = ({
    code,
    language = 'javascript',
    maxHeight = '200px',
}: {
    code: string;
    language?: string;
    maxHeight?: string;
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className='relative'>
            <div
                className={`relative ${
                    !isExpanded ? 'max-h-[200px]' : ''
                } overflow-hidden transition-all duration-200`}
            >
                <SyntaxHighlighter
                    language={language}
                    style={vscDarkPlus}
                    customStyle={{
                        margin: 0,
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                    }}
                >
                    {code}
                </SyntaxHighlighter>
                {!isExpanded && (
                    <div className='absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent' />
                )}
            </div>
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className='flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mt-1'
            >
                {isExpanded ? (
                    <>
                        <ChevronUp className='h-4 w-4' />
                        Show less
                    </>
                ) : (
                    <>
                        <ChevronDown className='h-4 w-4' />
                        Show more
                    </>
                )}
            </button>
        </div>
    );
};

const OutputComparison = ({
    expected,
    received,
}: {
    expected: string;
    received: string;
}) => {
    const isMatch = expected === received;
    const { t } = useTranslation();

    return (
        <div className='space-y-4'>
            <div className='flex flex-col'>
                <span className='text-sm font-medium mb-1'>
                    {t('testResults.expected')}:
                </span>
                <div
                    className={
                        isMatch
                            ? ''
                            : 'border-2 border-red-500/20 rounded-lg p-1'
                    }
                >
                    <CodeBlock code={expected} />
                </div>
            </div>
            <div className='flex flex-col'>
                <span className='text-sm font-medium mb-1'>
                    {t('testResults.received')}:
                </span>
                <div
                    className={
                        isMatch
                            ? ''
                            : 'border-2 border-red-500/20 rounded-lg p-1'
                    }
                >
                    <CodeBlock code={received} />
                </div>
            </div>
            {!isMatch && (
                <div className='text-sm text-red-500 font-medium flex items-center gap-2'>
                    <XCircle className='h-4 w-4' />
                    {t('testResults.mismatch')}
                </div>
            )}
        </div>
    );
};

export default function TestCaseResultsPage() {
    const { t } = useTranslation();
    const params = useParams<{ id: string }>();
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [testResults, setTestResults] = useState<TestCaseResult[]>([]);
    const [code, setCode] = useState<string>('');
    useEffect(() => {
        const fetchTestResults = async () => {
            if (!params.id || !session?.user?.id) return;

            try {
                setLoading(true);
                const response = await getSubmissionById(params.id);
                if (response.submission?.testCasesResults) {
                    setTestResults(response.submission.testCasesResults);
                }
                if (response.submission?.code) {
                    setCode(response.submission.code);
                }
            } catch (error) {
                console.error('Failed to fetch test results:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to fetch test results.',
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
            <div className='container mx-auto py-8'>
                <Skeleton className='h-8 w-64 mb-6' />
                <Skeleton className='h-[200px] mb-8' />
                <Skeleton className='h-[400px]' />
            </div>
        );
    }

    return (
        <div className='container mx-auto py-8'>
            <h1 className='text-3xl font-bold mb-6'>
                {t('testResults.title')}
            </h1>

            {/* Summary Card */}
            <Card className='mb-8'>
                <CardHeader>
                    <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                        <div className='flex flex-col'>
                            <span className='text-sm text-muted-foreground'>
                                {t('testResults.summary.totalTests')}
                            </span>
                            <span className='text-2xl font-bold'>
                                {testResults.length}
                            </span>
                        </div>
                        <div className='flex flex-col'>
                            <span className='text-sm text-muted-foreground'>
                                {t('testResults.summary.passed')}
                            </span>
                            <span className='text-2xl font-bold text-green-600'>
                                {testResults.filter((r) => r.status).length}
                            </span>
                        </div>
                        <div className='flex flex-col'>
                            <span className='text-sm text-muted-foreground'>
                                {t('testResults.summary.failed')}
                            </span>
                            <span className='text-2xl font-bold text-red-600'>
                                {testResults.filter((r) => !r.status).length}
                            </span>
                        </div>
                        <div className='flex flex-col'>
                            <span className='text-sm text-muted-foreground'>
                                {t('testResults.summary.successRate')}
                            </span>
                            <span className='text-2xl font-bold'>
                                {testResults.length > 0
                                    ? Math.round(
                                          (testResults.filter((r) => r.status)
                                              .length /
                                              testResults.length) *
                                              100
                                      )
                                    : 0}
                                %
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Detailed Results Table */}
            {/* Submitted Code Card */}
            {code && (
                <Card className='mb-8'>
                    <CardHeader>
                        <CardTitle>{t('testResults.submittedCode')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CodeBlock code={code} language={'javascript'} />
                    </CardContent>
                </Card>
            )}

            {/* Test Results Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Detailed Results</CardTitle>
                </CardHeader>
                <CardContent>
                    {testResults.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>
                                        {t('testResults.details.status')}
                                    </TableHead>
                                    <TableHead>
                                        {t('testResults.details.input')}
                                    </TableHead>
                                    <TableHead className='w-1/3'>
                                        {t('testResults.details.output')}
                                    </TableHead>
                                    <TableHead>
                                        {t('testResults.details.time')}
                                    </TableHead>
                                    <TableHead>
                                        {t('testResults.details.memory')}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {testResults.map((result) => (
                                    <TableRow key={result.testCase.id}>
                                        <TableCell>
                                            <div className='flex items-center gap-2'>
                                                {result.status ? (
                                                    <>
                                                        <CheckCircle2 className='h-5 w-5 text-green-600' />
                                                        <Badge variant='success'>
                                                            {t(
                                                                'testResults.status.passed'
                                                            )}
                                                        </Badge>
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle className='h-5 w-5 text-red-600' />
                                                        <Badge variant='destructive'>
                                                            {t(
                                                                'testResults.status.failed'
                                                            )}
                                                        </Badge>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <CodeBlock
                                                code={result.testCase.input}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <OutputComparison
                                                expected={
                                                    result.testCase.output
                                                }
                                                received={result.SolutionOutput}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    result.time >
                                                    result.testCase.timeLimit
                                                        ? 'destructive'
                                                        : 'outline'
                                                }
                                            >
                                                {result.time}ms
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    result.memoryUsage >
                                                    result.testCase.memoryLimit
                                                        ? 'destructive'
                                                        : 'outline'
                                                }
                                            >
                                                {result.memoryUsage}MB
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className='text-center py-8 text-muted-foreground'>
                            {t('testResults.noResults')}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
