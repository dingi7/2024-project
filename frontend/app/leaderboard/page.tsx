'use client';

import { Card } from '@/components/ui/card';
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from '@/components/ui/table';
import { getLeaderboard } from '../api/requests';
import LeaderboardTop3Card from './components/LeaderboardTop3Card';
import { useTranslation } from "@/lib/useTranslation";
import { useEffect, useState } from 'react';

type LeaderboardEntry = {
    userId: string;
    username: string;
    totalScore: number;
    contestsParticipated: number;
};

function Leaderboard() {
    const { t } = useTranslation();
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const data = await getLeaderboard();
                setLeaderboardData(data);
            } catch (error) {
                console.error('Error fetching leaderboard:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className='w-full max-w-6xl mx-auto py-10 px-4 md:px-6 flex flex-col flex-1'>
            {leaderboardData?.length > 0 ? (
                <>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
                        {leaderboardData.slice(0, 3).map((user, index) => (
                            <LeaderboardTop3Card
                                key={user.userId}
                                rank={index + 1}
                                username={user.username}
                                totalScore={user.totalScore}
                            />
                        ))}
                    </div>
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className='w-[80px]'>
                                        {t('leaderboard.table.rank')}
                                    </TableHead>
                                    <TableHead>{t('leaderboard.table.username')}</TableHead>
                                    <TableHead className='text-right'>
                                        {t('leaderboard.table.contests')}
                                    </TableHead>
                                    <TableHead className='text-right'>
                                        {t('leaderboard.table.score')}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leaderboardData.map((user, index) => (
                                    <TableRow key={user.userId}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell className='font-medium'>
                                            {user.username}
                                        </TableCell>
                                        <TableCell className='text-right'>
                                            {user.contestsParticipated}
                                        </TableCell>
                                        <TableCell className='text-right'>
                                            {user.totalScore.toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </>
            ) : (
                <Card className='p-6 text-center'>
                    <p className='text-lg font-medium'>
                        {t('leaderboard.noData.title')}
                    </p>
                    <p className='text-sm text-gray-500 mt-2'>
                        {t('leaderboard.noData.description')}
                    </p>
                </Card>
            )}
        </div>
    );
}

export default Leaderboard;
