'use client';

import { Card } from '@/components/ui/card';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
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

type SortConfig = {
    key: keyof LeaderboardEntry | null;
    direction: 'asc' | 'desc';
};

function Leaderboard() {
    const { t } = useTranslation();
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'totalScore', direction: 'desc' });

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

    const sortData = (data: LeaderboardEntry[]) => {
        if (!sortConfig.key) return data;

        return [...data].sort((a, b) => {
            if (a[sortConfig.key!] < b[sortConfig.key!]) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (a[sortConfig.key!] > b[sortConfig.key!]) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    };

    const handleSort = (key: keyof LeaderboardEntry) => {
        setSortConfig((currentConfig) => ({
            key,
            direction:
                currentConfig.key === key && currentConfig.direction === 'desc'
                    ? 'asc'
                    : 'desc',
        }));
    };

    const filteredData = sortData(
        leaderboardData.filter(user =>
            user.username.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

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
                    <div className="mb-4">
                        <Input
                            placeholder={t('leaderboard.search.placeholder') || "Search users..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className='w-[80px]'>
                                        {t('leaderboard.table.rank')}
                                    </TableHead>
                                    <TableHead>
                                        <Button
                                            variant="ghost"
                                            onClick={() => handleSort('username')}
                                            className="hover:bg-transparent"
                                        >
                                            {t('leaderboard.table.username')}
                                            <ArrowUpDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </TableHead>
                                    <TableHead className='text-right'>
                                        <Button
                                            variant="ghost"
                                            onClick={() => handleSort('contestsParticipated')}
                                            className="hover:bg-transparent ml-auto"
                                        >
                                            {t('leaderboard.table.contests')}
                                            <ArrowUpDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </TableHead>
                                    <TableHead className='text-right'>
                                        <Button
                                            variant="ghost"
                                            onClick={() => handleSort('totalScore')}
                                            className="hover:bg-transparent ml-auto"
                                        >
                                            {t('leaderboard.table.score')}
                                            <ArrowUpDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredData.map((user, index) => (
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
