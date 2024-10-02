'use server';

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
import { useState } from 'react';
import LeaderboardTop3Card from './components/LeaderboardTop3Card';

type LeaderboardEntry = {
    userId: string;
    username: string;
    totalScore: number;
    contestsParticipated: number;
};

async function Leaderboard() {

    const leaderboardData: LeaderboardEntry[] = await getLeaderboard();


    return (
        <div className='w-full max-w-6xl mx-auto py-10 px-4 md:px-6 flex flex-col flex-1'>
            {leaderboardData.length > 0 ? (
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
                                        Rank
                                    </TableHead>
                                    <TableHead>Username</TableHead>
                                    <TableHead className='text-right'>
                                        Contests
                                    </TableHead>
                                    <TableHead className='text-right'>
                                        Score
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
                        No leaderboard data available yet.
                    </p>
                    <p className='text-sm text-gray-500 mt-2'>
                        Be the first to submit and appear on the leaderboard!
                    </p>
                </Card>
            )}
        </div>
    );
}

export default Leaderboard;
