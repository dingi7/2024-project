'use client';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useTranslation } from '@/lib/useTranslation';
import { useLayoutEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

export default function GithubRepos({
    repos,
    selectedRepo,
    setSelectedRepo,
}: {
    repos: any[];
    selectedRepo: string;
    setSelectedRepo: (repo: string) => void;
}) {
    useLayoutEffect(() => {
        console.log('Repos updated in GithubRepos:', repos);
        toast({
            title: 'Repos updated',
        });
    }, [repos]);

    const handleRepoChange = (value: string) => {
        setSelectedRepo(value);
    };
    const handleClearRepo = () => {
        setSelectedRepo('');
    };
    const { t } = useTranslation();

    return (
        <div className='space-y-4'>
            <div className='flex items-center space-x-2'>
                <Select onValueChange={handleRepoChange} value={selectedRepo}>
                    <SelectTrigger className='w-full'>
                        <SelectValue
                            placeholder={t(
                                'contestPage.submission.placeholder'
                            )}
                        />
                    </SelectTrigger>
                    <SelectContent>
                        {repos.length > 0 &&
                            repos.map((repo) => (
                                <SelectItem key={repo.id} value={repo.name}>
                                    {repo.name}
                                </SelectItem>
                            ))}
                    </SelectContent>
                </Select>
                {selectedRepo && (
                    <Button
                        variant='outline'
                        onClick={handleClearRepo}
                        className='flex-shrink-0'
                    >
                        <X className='w-4 h-4' />
                    </Button>
                )}
            </div>
        </div>
    );
}
