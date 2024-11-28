import { useTranslation } from '@/lib/useTranslation';
import { useEffect, useState } from 'react';

interface TimeLockedProps {
    startDate: string;
    endDate: string;
}

export function TimeLocked({ startDate, endDate }: TimeLockedProps) {
    const { t } = useTranslation();
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            if (now < start) {
                const diff = start.getTime() - now.getTime();
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                
                setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [startDate]);

    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    const isBeforeStart = now < start;
    const isAfterEnd = now > end;

    return (
        <div className="fixed inset-0 z-0 flex items-center justify-center pt-16">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <div className="relative p-8 border border-border rounded-lg shadow-lg bg-card text-card-foreground text-center w-full mx-4">
                {isBeforeStart ? (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-semibold text-primary">{t('contest.notStarted')}</h2>
                        <p className="text-xl text-muted-foreground">{t('contest.startsOn')}: {start.toLocaleString()}</p>
                        <p className="font-mono text-3xl font-bold text-primary">{t('contest.startsIn')}: {timeLeft}</p>
                    </div>
                ) : isAfterEnd ? (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-semibold text-destructive">{t('Contest Ended')}</h2>
                        <p className="text-xl text-muted-foreground">{t('Contest ended at')} {end.toLocaleString()}</p>
                    </div>
                ) : null}
            </div>
        </div>
    );
}