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
import { useEffect, useState } from 'react';
import LeaderboardTop3Card from './components/LeaderboardTop3Card';

type LeaderboardEntry = {
    userId: string;
    username: string;
    totalScore: number;
    contestsParticipated: number;
};

function Leaderboard() {
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>(
        []
    );
    useEffect(() => {
        const fetchLeaderboard = async () => {
            const fetchedData = await getLeaderboard();
            setLeaderboardData(fetchedData);
        };
        fetchLeaderboard();
    }, []);

    console.log(leaderboardData);
    return (
        <div className='w-full max-w-6xl mx-auto py-10 px-4 md:px-6 flex flex-col flex-1'>
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
                            <TableHead className='w-[80px]'>Rank</TableHead>
                            <TableHead>Username</TableHead>
                            <TableHead className='text-right'>
                                Contests
                            </TableHead>
                            <TableHead className='text-right'>Score</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {leaderboardData.map((user, index) => (
                            <TableRow>
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
        </div>
    );
}

export default Leaderboard;
