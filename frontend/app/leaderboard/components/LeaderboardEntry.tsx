import { TableCell, TableRow } from '@/components/ui/table';

export default function LeaderboardEntry({
    userId,
    username,
    totalScore,
    contestsParticipated,
}: {
    userId: string;
    username: string;
    totalScore: number;
    contestsParticipated: number;
}) {
    return (
        <TableRow>
            <TableCell>{userId}</TableCell>
            <TableCell className='font-medium'>{username}</TableCell>
            <TableCell className='text-right'>{contestsParticipated}</TableCell>
            <TableCell className='text-right'>{totalScore}</TableCell>
        </TableRow>
    );
}
