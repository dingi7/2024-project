import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from '@/components/ui/card';
import { TrophyIcon } from 'lucide-react';

export default function LeaderboardTop3Card({
    rank,
    username,
    totalScore,
}: {
    rank: number;
    username: string;
    totalScore: number;
}) {
    const cardStyle = () => {
        switch (rank) {
            case 1:
                return 'bg-primary text-primary-foreground';
            case 2:
                return 'bg-secondary text-secondary-foreground';
            case 3:
                return 'bg-muted text-muted-foreground';
            default:
                return 'bg-primary text-primary-foreground';
        }
    };

    return (
        <Card className={cardStyle()}>
            <CardHeader className='pb-2'>
                <CardTitle>{rank}. {username}</CardTitle>
                <div className={`flex items-center gap-2 ${rank === 1 ? 'text-foreground' : ''}`}>
                    <span className='font-bold text-2xl'>{totalScore.toLocaleString()}</span>
                    <TrophyIcon className={`w-6 h-6 ${rank === 1 ? 'text-foreground' : 'text-muted-foreground'}`} />
                </div>
            </CardHeader>
            <CardContent>
                <div className={`text-xs ${rank === 1 ? 'text-primary-foreground/80' : rank === 2 ? 'text-secondary-foreground/80' : 'text-muted-foreground/80'}`}>
                    Total Score
                </div>
            </CardContent>
        </Card>
    );
}
