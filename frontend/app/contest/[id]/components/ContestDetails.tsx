import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import ContestTestCases from './ContestTestCases';
import { formatDate } from '@/lib/utils';
import { Contest, TestCase } from '@/lib/types';
import { deleteContest } from '@/app/api/requests';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import ContestEditForm from './ContestEditForm';
import { useTranslation } from '@/lib/useTranslation';
import { useContestStore } from '../../../../lib/stores/ContestStore';

type Props = {
    contest: Contest;
    isOwner: boolean;
    setContest: (contest: Contest) => void;
    isEditEnabled: boolean;
    setIsEditEnabled: (isEditEnabled: boolean) => void;
    onEdit: (updatedContest: Contest) => void;
    contestRules: string | null;
};

export default function ContestDetails({
    contest,
    isOwner,
    setContest,
    isEditEnabled,
    setIsEditEnabled,
    onEdit,
    contestRules,
}: Props) {
    const { toast } = useToast();
    const router = useRouter();
    const { t } = useTranslation();
    const [rulesFile, setRulesFile] = useState<File | null>(null);
    const updateTestCase = useContestStore(state => state.updateTestCase);

    const handleEditContest = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        onEdit({
            ...contest,
            title: (form.elements.namedItem('title') as HTMLInputElement).value,
            description: (form.elements.namedItem('description') as HTMLTextAreaElement).value,
            startDate: (form.elements.namedItem('startDate') as HTMLInputElement).value,
            endDate: (form.elements.namedItem('endDate') as HTMLInputElement).value,
            prize: parseInt((form.elements.namedItem('prize') as HTMLInputElement).value),
        });
    };

    const handleRulesFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setRulesFile(e.target.files[0]);
        }
    };

    const handleUpdateTestCases = (testCase: TestCase, action: 'delete' | 'add' | 'edit') => {
        // Update the global store
        updateTestCase(testCase, action);
        
        // Also update local state for backward compatibility
        if (action === 'add') {
            setContest({
                ...contest,
                testCases: [...contest.testCases, testCase],
            });
        } else if (action === 'delete') {
            setContest({
                ...contest,
                testCases: contest.testCases.filter(
                    (tc) => tc.id !== testCase.id
                ),
            });
        } else if (action === 'edit') {
            setContest({
                ...contest,
                testCases: contest.testCases.map(
                    tc => tc.id === testCase.id ? testCase : tc
                ),
            });
        }
    };

    const deleteContestPopup = async () => {
        toast({
            title: 'Delete Contest',
            description: 'Are you sure you want to delete this contest?',
            action: (
                <Button variant='destructive' onClick={confirmDeleteContest}>
                    Delete
                </Button>
            ),
        });
    };

    const confirmDeleteContest = async () => {
        try {
            await deleteContest(contest.id);
            toast({
                title: 'Contest deleted',
                description: 'The contest has been successfully deleted.',
            });
            router.push('/contests');
        } catch (error) {
            console.error('Failed to delete contest:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete contest. Please try again.',
                variant: 'destructive',
            });
        }
    };

    return (
        <div>
            <h1 className='text-2xl font-bold mb-4'>{contest.title}</h1>
            <p className='text-muted-foreground mb-4'>{contest.description}</p>
            <div className='grid grid-cols-2 gap-4 mb-4'>
                
                <div>
                    <h3 className='text-sm font-medium mb-1'>{t('contestPage.startDate')}</h3>
                    <p>{formatDate(contest.startDate)}</p>
                </div>
                <div>
                    <h3 className='text-sm font-medium mb-1'>{(t('contestPage.endDate'))}</h3>
                    <p>{formatDate(contest.endDate)}</p>
                </div>
                <div>
                    <h3 className='text-sm font-medium mb-1'>{t('contestPage.prize')}</h3>
                    <p>{contest.prize}</p>
                </div>
                {contestRules && (
                    <div>
                        <h3 className='text-sm font-medium mb-1'>
                            {t('contestPage.contestRules')}
                        </h3>
                        <Button
                            variant='link'
                            onClick={() => window.open(contestRules, '_blank')}
                            className='p-0'
                        >
                            {t('contestPage.contestRulesButton')}
                        </Button>
                    </div>
                )}
            </div>
            {isOwner && (
                <div className='mt-4 flex gap-2'>
                    <Button onClick={() => setIsEditEnabled(!isEditEnabled)}>
                        {isEditEnabled ? t('contestPage.buttons.cancelEdit') : t('contestPage.buttons.editContest')}
                    </Button>
                    <Button variant='destructive' onClick={deleteContestPopup}>
                        {t('contestPage.buttons.deleteContest')}
                    </Button>
                </div>
            )}
            {isOwner && isEditEnabled && <ContestEditForm contest={contest} onEdit={onEdit} updateTestCases={handleUpdateTestCases} />}
        </div>
    );
};
