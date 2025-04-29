import { useTranslation } from '@/lib/useTranslation';
import Link from 'next/link';
import { GithubIcon } from 'lucide-react';

export default function Contest({
    title,
    description,
    id,
    language,
    startDate,
    endDate,
    prize,
    contestStructure,
}: {
    title: string;
    description: string;
    id: string;
    language: string;
    startDate: string;
    endDate: string;
    prize: number;
    contestStructure?: string;
}) {
    const { t } = useTranslation();
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    const isBeforeStart = now < start;
    const isAfterEnd = now > end;

    return (
        <div className='bg-background p-6 rounded-lg border border-border'>
            <div className='flex justify-between items-center mb-2'>
                <div className='flex items-center gap-2'>
                    <h3 className='text-xl font-semibold text-primary'>
                        {title}
                    </h3>
                    {contestStructure && contestStructure !== 'null' && (
                        <GithubIcon className='h-5 w-5 text-muted-foreground' />
                    )}
                    {(isBeforeStart || isAfterEnd) && (
                        <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                                isBeforeStart
                                    ? 'bg-blue-100 text-green-700'
                                    : 'bg-gray-100 text-red-700'
                            }`}
                        >
                            {isBeforeStart ? 'Upcoming' : 'Ended'}
                        </span>
                    )}
                </div>
                <span className='text-base font-medium bg-secondary px-3 py-1 rounded-md shadow-sm transition-all duration-200 hover:shadow-md'>
                    {language}
                </span>
            </div>
            <p className='text-foreground mb-4'>{description}</p>
            <div className='flex justify-between text-sm text-foreground mb-4'>
                <span>
                    {t('contestsPage.filters.startDate')}:{' '}
                    {new Date(startDate).toLocaleDateString()}
                </span>
                <span>
                    {t('contestsPage.filters.endDate')}:{' '}
                    {new Date(endDate).toLocaleDateString()}
                </span>
            </div>
            <div className='flex justify-between items-center'>
                <span className='text-lg font-semibold text-primary'>
                    ${prize.toLocaleString()}
                </span>
                <Link
                    href={`/contest/${id}`}
                    className='px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors'
                    prefetch={false}
                >
                    {t('contestsPage.viewDetails')}
                </Link>
            </div>
        </div>
    );
}
