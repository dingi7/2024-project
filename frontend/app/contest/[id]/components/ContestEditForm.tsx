import { Button } from '@/components/ui/button';
import ContestTestCases from './ContestTestCases';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Contest, TestCase } from '@/lib/types';
import { SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/components/ui/use-toast';
import { decodeBase64ToBlobUrl } from '@/lib/utils';
import { useTranslation } from '@/lib/useTranslation';

const ContestScheme = z.object({
    title: z.string().min(3).max(32),
    description: z.string().min(3).max(555),
    startDate: z.string(),
    endDate: z.string(),
    prize: z.string(),
    rulesFile: z.any().optional(),
    testCaseFile: z.any().optional(),
});

type ContestType = z.infer<typeof ContestScheme>;

type Props = {
    onEdit: (updatedContest: Contest) => void;
    contest: Contest;
    updateTestCases: (testCase: TestCase, action: 'delete' | 'add') => void;
};

export default function ContestEditForm({ contest, onEdit, updateTestCases }: Props) {
    const { t } = useTranslation();
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ContestType>({ resolver: zodResolver(ContestScheme) });

    const handleEditContest: SubmitHandler<ContestType> = async (data) => {
        try {
            onEdit({
                ...contest,
                title: data.title,
                description: data.description,
                startDate: data.startDate,
                endDate: data.endDate,
                prize: Number(data.prize),
                contestRules: data.rulesFile
            })
        } catch (error) {
            toast({
                title: t('contestPage.editForm.errors.editFailed'),
                description: 'error',
                variant: 'destructive',
            });
        }
    };
    console.log(contest.contestStructure)

    return (
        <div className='mt-8'>
            <h2 className='text-lg font-medium mb-4'>{t('contestPage.editForm.title')}</h2>
            <form onSubmit={handleSubmit(handleEditContest)}>
                <div className='grid grid-cols-2 gap-6 mb-6'>
                    <div>
                        <Label htmlFor='title'>{t('contestPage.editForm.fields.title')}</Label>
                        <Input
                            id='title'
                            defaultValue={contest.title}
                            required
                            {...register('title')}
                        />
                    </div>
                    <div>
                        <Label htmlFor='description'>{t('contestPage.editForm.fields.description')}</Label>
                        <Textarea
                            id='description'
                            defaultValue={contest.description}
                            required
                            {...register('description')}
                        />
                        {errors.description && (
                            <p className='text-red-500'>
                                {errors.description.message}
                            </p>
                        )}
                    </div>
                </div>
                <div className='grid grid-cols-2 gap-6 mb-6'>
                    <div>
                        <Label htmlFor='startDate'>{t('contestPage.editForm.fields.startDate')}</Label>
                        <Input
                            id='startDate'
                            type='date'
                            defaultValue={new Date(contest.startDate).toISOString().split('T')[0]}
                            {...register('startDate')}
                        />
                    </div>
                    <div>
                        <Label htmlFor='endDate'>{t('contestPage.editForm.fields.endDate')}</Label>
                        <Input
                            id='endDate'
                            type='date'
                            defaultValue={new Date(contest.endDate).toISOString().split('T')[0]}
                            {...register('endDate')}
                        />
                    </div>
                </div>
                <div>
                    <Label htmlFor='prize'>{t('contestPage.editForm.fields.prize')}</Label>
                    <Input 
                        id='prize' 
                        defaultValue={contest.prize} 
                        required 
                        type='number' 
                        min={0} 
                        {...register('prize')} 
                    />
                </div>
                <div className='mt-4 mb-6'>
                    <Label htmlFor='rulesFile'>{t('contestPage.editForm.fields.rules')}</Label>
                    <div className='flex items-center gap-2'>
                        <Input
                            id='rulesFile'
                            type='file'
                            accept='.pdf'
                            {...register('rulesFile')}
                        />
                        {contest.contestRules && (
                            <Button
                                variant='outline'
                                onClick={() => window.open(decodeBase64ToBlobUrl(contest.contestRules!), '_blank')}
                            >
                                {t('contestPage.editForm.fields.viewCurrent')}
                            </Button>
                        )}
                    </div>
                </div>
                <div className="grid gap-2 mb-6">
                    <Label htmlFor="testCaseFile">
                        {t('contestPage.editForm.fields.testCase')}
                    </Label>
                    <Input
                        id="testCaseFile"
                        type="file"
                        accept=".pdf"
                        multiple={false}
                        {...register("testCaseFile")}
                    />
                </div>
                {contest.contestStructure && (
                    <ContestTestCases
                        contestId={contest.id}
                        dbTestCases={contest.testCases}
                        saveContestTestCase={updateTestCases}
                    />
                )}
                <Button type='submit' className='mt-4'>
                    {t('contestPage.editForm.buttons.saveChanges')}
                </Button>
            </form>
        </div>
    );
}
