'use client';

import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { SubmitHandler, useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, RefreshCw } from 'lucide-react';
import { format, setHours, setMinutes } from 'date-fns';
import { cn, reloadSession } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { createContest } from '@/app/api/requests';
import { getSession, useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import GithubRepos from '../[id]/github/RepoList';
import { useTranslation } from '@/lib/useTranslation';

const ContestScheme = z.object({
    title: z.string().min(3).max(32),
    description: z.string().min(3).max(255),
    dateRange: z.object({
        from: z.date(),
        to: z.date(),
    }),
    language: z.enum(['python', 'java', 'javascript', 'c++', 'c#']),
    prize: z.string(),
    rulesFile: z.any().optional(),
    contestStructure: z.string().optional(),
    testFiles: z.any().optional(),
    testFramework: z.enum(['jest', 'unittest', 'pytest']).optional(),
    isPublic: z.boolean().default(true),
    inviteOnly: z.boolean().default(false),
    enableAICodeEntryIdentification: z.boolean().default(false),
});

type ContestType = z.infer<typeof ContestScheme>;

export default function CreateContest() {
    const { toast } = useToast();
    let { data: session, status } = useSession();
    const router = useRouter();
    const [repos, setRepos] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useTranslation();

    const isAdmin = session?.role === 'admin';
    console.log(session);

    const fetchGithubRepos = async () => {
        if (!session?.githubAccessToken) {
            reloadSession();
        }

        setIsLoading(true);
        try {
            const response = await fetch('https://api.github.com/user/repos', {
                headers: {
                    Authorization: `Bearer ${session?.githubAccessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch repositories');
            }

            const data = await response.json();
            setRepos(data);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to fetch GitHub repositories',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        reloadSession();
        fetchGithubRepos();
        if (!isAdmin) {
            router.replace('/');
        }
    }, [status, isAdmin, router, reloadSession, fetchGithubRepos]);

    const {
        register,
        control,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch,
    } = useForm<ContestType>({ resolver: zodResolver(ContestScheme) });

    if (status === 'loading') {
        return null;
    }

    const handleCreateContest: SubmitHandler<ContestType> = async (data) => {
        if (!session!.user.id || !session) {
            toast({
                title: 'Error',
                description: t('createContest.errors.loginRequired'),
                variant: 'destructive',
            });
            return;
        }
        const payload = {
            title: data.title,
            description: data.description,
            language: data.language,
            startDate: data.dateRange.from,
            endDate: data.dateRange.to,
            prize: parseInt(data.prize),
            ownerId: session.user.id,
            testCases: [],
            contestRules: data.rulesFile,
            contestStructure: data.contestStructure
                ? repos.find((repo) => repo.name === data.contestStructure)
                      ?.clone_url
                : null,
            testFramework: data.contestStructure ? data.testFramework : null,
            testFiles: data.contestStructure ? data.testFiles : null,
            isPublic: data.isPublic,
            inviteOnly: !data.isPublic && data.inviteOnly,
            enableAICodeEntryIdentification: data.enableAICodeEntryIdentification,
        };

        try {
            await createContest(payload);
            toast({
                title: t('createContest.success.created'),
                description: t('createContest.success.created'),
                variant: 'success',
            });
            reset();
            setValue('language', 'python');
            router.push('/contests');
        } catch (error) {
            toast({
                title: t('createContest.errors.createFailed'),
                description: t('createContest.errors.createFailed'),
                variant: 'destructive',
            });
        }
    };

    return (
        <div className='flex justify-center items-center min-h-screen bg-background p-4'>
            <Card className='w-full max-w-md'>
                <CardHeader>
                    <CardTitle className='text-2xl font-bold'>
                        {t('createContest.title')}
                    </CardTitle>
                    <CardDescription>
                        {t('createContest.description')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form
                        className='grid gap-4'
                        onSubmit={handleSubmit(handleCreateContest)}
                    >
                        <div className='grid gap-2'>
                            <Label htmlFor='title'>
                                {t('createContest.form.title.label')}{' '}
                                <span className='text-red-500'>*</span>
                            </Label>
                            <Input
                                id='title'
                                placeholder={t(
                                    'createContest.form.title.placeholder'
                                )}
                                required
                                {...register('title')}
                            />
                            {errors.title && (
                                <p className='text-red-500'>
                                    {errors.title.message}
                                </p>
                            )}
                        </div>
                        <div className='grid gap-2'>
                            <Label htmlFor='description'>
                                {t('createContest.form.description.label')}{' '}
                                <span className='text-red-500'>*</span>
                            </Label>
                            <Textarea
                                id='description'
                                placeholder={t(
                                    'createContest.form.description.placeholder'
                                )}
                                required
                                {...register('description')}
                            />
                            {errors.description && (
                                <p className='text-red-500'>
                                    {errors.description.message}
                                </p>
                            )}
                        </div>
                        <div className='grid gap-2'>
                            <Label htmlFor='language'>
                                {t('createContest.form.language.label')}{' '}
                                <span className='text-red-500'>*</span>
                            </Label>
                            <Controller
                                name='language'
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        required
                                    >
                                        <SelectTrigger id='language'>
                                            <SelectValue
                                                placeholder={t(
                                                    'createContest.form.language.placeholder'
                                                )}
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value='python'>
                                                Python
                                            </SelectItem>
                                            <SelectItem value='javascript'>
                                                JavaScript
                                            </SelectItem>
                                            <SelectItem value='java'>
                                                Java
                                            </SelectItem>
                                            <SelectItem value='c++'>
                                                C++
                                            </SelectItem>
                                            <SelectItem value='c#'>
                                                C#
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.language && (
                                <p className='text-red-500'>
                                    {errors.language.message}
                                </p>
                            )}
                        </div>
                        <div className='grid gap-2'>
                            <Label>
                                {t('createContest.form.duration.label')}{' '}
                                <span className='text-red-500'>*</span>
                            </Label>
                            <Controller
                                control={control}
                                name='dateRange'
                                render={({ field }) => (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={'outline'}
                                                className={cn(
                                                    'w-full justify-start text-left font-normal',
                                                    !field.value &&
                                                        'text-muted-foreground'
                                                )}
                                            >
                                                <CalendarIcon className='mr-2 h-4 w-4' />
                                                {field.value?.from ? (
                                                    field.value.to ? (
                                                        <>
                                                            {format(
                                                                field.value
                                                                    .from,
                                                                'LLL dd, y HH:mm'
                                                            )}{' '}
                                                            -{' '}
                                                            {format(
                                                                field.value.to,
                                                                'LLL dd, y HH:mm'
                                                            )}
                                                        </>
                                                    ) : (
                                                        format(
                                                            field.value.from,
                                                            'LLL dd, y HH:mm'
                                                        )
                                                    )
                                                ) : (
                                                    <span>
                                                        {t(
                                                            'createContest.form.duration.placeholder'
                                                        )}
                                                    </span>
                                                )}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            className='w-auto p-0'
                                            align='start'
                                        >
                                            <Calendar
                                                initialFocus
                                                mode='range'
                                                defaultMonth={field.value?.from}
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                numberOfMonths={2}
                                            />
                                            <div className='grid grid-cols-2 gap-2 p-3 border-t border-border'>
                                                <div>
                                                    <Label>
                                                        {t(
                                                            'createContest.form.duration.startTime'
                                                        )}
                                                    </Label>
                                                    <div className='flex items-center mt-1'>
                                                        <Select
                                                            onValueChange={(
                                                                value
                                                            ) => {
                                                                const [
                                                                    hours,
                                                                    minutes,
                                                                ] =
                                                                    value.split(
                                                                        ':'
                                                                    );
                                                                const newFrom =
                                                                    setMinutes(
                                                                        setHours(
                                                                            field
                                                                                .value
                                                                                ?.from ||
                                                                                new Date(),
                                                                            parseInt(
                                                                                hours
                                                                            )
                                                                        ),
                                                                        parseInt(
                                                                            minutes
                                                                        )
                                                                    );
                                                                field.onChange({
                                                                    ...field.value,
                                                                    from: newFrom,
                                                                });
                                                            }}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue
                                                                    placeholder={t(
                                                                        'createContest.form.duration.startTime'
                                                                    )}
                                                                />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {Array.from({
                                                                    length:
                                                                        24 * 4,
                                                                }).map(
                                                                    (
                                                                        _,
                                                                        index
                                                                    ) => {
                                                                        const hours =
                                                                            Math.floor(
                                                                                index /
                                                                                    4
                                                                            );
                                                                        const minutes =
                                                                            (index %
                                                                                4) *
                                                                            15;
                                                                        return (
                                                                            <SelectItem
                                                                                key={
                                                                                    index
                                                                                }
                                                                                value={`${hours
                                                                                    .toString()
                                                                                    .padStart(
                                                                                        2,
                                                                                        '0'
                                                                                    )}:${minutes
                                                                                    .toString()
                                                                                    .padStart(
                                                                                        2,
                                                                                        '0'
                                                                                    )}`}
                                                                            >
                                                                                {`${hours
                                                                                    .toString()
                                                                                    .padStart(
                                                                                        2,
                                                                                        '0'
                                                                                    )}:${minutes
                                                                                    .toString()
                                                                                    .padStart(
                                                                                        2,
                                                                                        '0'
                                                                                    )}`}
                                                                            </SelectItem>
                                                                        );
                                                                    }
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label>
                                                        {t(
                                                            'createContest.form.duration.endTime'
                                                        )}
                                                    </Label>
                                                    <div className='flex items-center mt-1'>
                                                        <Select
                                                            onValueChange={(
                                                                value
                                                            ) => {
                                                                const [
                                                                    hours,
                                                                    minutes,
                                                                ] =
                                                                    value.split(
                                                                        ':'
                                                                    );
                                                                const newTo =
                                                                    setMinutes(
                                                                        setHours(
                                                                            field
                                                                                .value
                                                                                ?.to ||
                                                                                new Date(),
                                                                            parseInt(
                                                                                hours
                                                                            )
                                                                        ),
                                                                        parseInt(
                                                                            minutes
                                                                        )
                                                                    );
                                                                field.onChange({
                                                                    ...field.value,
                                                                    to: newTo,
                                                                });
                                                            }}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue
                                                                    placeholder={t(
                                                                        'createContest.form.duration.endTime'
                                                                    )}
                                                                />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {Array.from({
                                                                    length:
                                                                        24 * 4,
                                                                }).map(
                                                                    (
                                                                        _,
                                                                        index
                                                                    ) => {
                                                                        const hours =
                                                                            Math.floor(
                                                                                index /
                                                                                    4
                                                                            );
                                                                        const minutes =
                                                                            (index %
                                                                                4) *
                                                                            15;
                                                                        return (
                                                                            <SelectItem
                                                                                key={
                                                                                    index
                                                                                }
                                                                                value={`${hours
                                                                                    .toString()
                                                                                    .padStart(
                                                                                        2,
                                                                                        '0'
                                                                                    )}:${minutes
                                                                                    .toString()
                                                                                    .padStart(
                                                                                        2,
                                                                                        '0'
                                                                                    )}`}
                                                                            >
                                                                                {`${hours
                                                                                    .toString()
                                                                                    .padStart(
                                                                                        2,
                                                                                        '0'
                                                                                    )}:${minutes
                                                                                    .toString()
                                                                                    .padStart(
                                                                                        2,
                                                                                        '0'
                                                                                    )}`}
                                                                            </SelectItem>
                                                                        );
                                                                    }
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                )}
                            />
                            {errors.dateRange && (
                                <p className='text-red-500'>
                                    {errors.dateRange.message}
                                </p>
                            )}
                        </div>
                        <div className='grid gap-2'>
                            <Label htmlFor='prize'>
                                {t('createContest.form.prize.label')}{' '}
                                <span className='text-red-500'>*</span>
                            </Label>
                            <Input
                                id='prize'
                                placeholder={t(
                                    'createContest.form.prize.placeholder'
                                )}
                                type='number'
                                required
                                min={0}
                                {...register('prize')}
                            />
                            {errors.prize && (
                                <p className='text-red-500'>
                                    {errors.prize.message}
                                </p>
                            )}
                        </div>
                        <div className='grid gap-2'>
                            <div className='flex items-center justify-between'>
                                <div className='space-y-0.5'>
                                    <Label htmlFor='isPublic'>
                                        {t('createContest.form.isPublic.label') || 'Public Contest'}
                                    </Label>
                                    <p className='text-sm text-muted-foreground'>
                                        {t('createContest.form.isPublic.description') ||
                                            'Public contests are visible to all users'}
                                    </p>
                                </div>
                                <Controller
                                    name='isPublic'
                                    control={control}
                                    defaultValue={true}
                                    render={({ field }) => (
                                        <Switch
                                            id='isPublic'
                                            checked={field.value}
                                            onCheckedChange={(checked) => {
                                                field.onChange(checked);
                                                if (checked) {
                                                    setValue('inviteOnly', false);
                                                }
                                            }}
                                        />
                                    )}
                                />
                            </div>
                        </div>
                        <div className='grid gap-2'>
                            <div className='flex items-center justify-between'>
                                <div className='space-y-0.5'>
                                    <Label htmlFor='inviteOnly'>
                                        {t('createContest.form.inviteOnly.label') || 'Invite Only'}
                                    </Label>
                                    <p className='text-sm text-muted-foreground'>
                                        {t('createContest.form.inviteOnly.description') ||
                                            'Only invited users can participate in this contest'}
                                    </p>
                                </div>
                                <Controller
                                    name='inviteOnly'
                                    control={control}
                                    defaultValue={false}
                                    render={({ field }) => (
                                        <Switch
                                            id='inviteOnly'
                                            checked={field.value}
                                            onCheckedChange={(checked) => {
                                                field.onChange(checked);
                                                if (checked) {
                                                    setValue('isPublic', false);
                                                }
                                            }}
                                            disabled={watch('isPublic')}
                                        />
                                    )}
                                />
                            </div>
                        </div>
                        <div className='grid gap-2'>
                            <div className='flex items-center justify-between'>
                                <div className='space-y-0.5'>
                                    <Label htmlFor='enableAICodeEntryIdentification'>
                                        {t('createContest.form.enableAICodeEntryIdentification.label') || 'Enable AI Code Detection'}
                                    </Label>
                                    <p className='text-sm text-muted-foreground'>
                                        {t('createContest.form.enableAICodeEntryIdentification.description') ||
                                            'Enable AI-powered detection of code entries'}
                                    </p>
                                </div>
                                <Controller
                                    name='enableAICodeEntryIdentification'
                                    control={control}
                                    defaultValue={false}
                                    render={({ field }) => (
                                        <Switch
                                            id='enableAICodeEntryIdentification'
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    )}
                                />
                            </div>
                        </div>
                        <div className='grid gap-2'>
                            <div className='flex justify-between items-center'>
                                <Label htmlFor='github-repo-url'>
                                    {t('createContest.form.structure.label')}{' '}
                                    {t('createContest.form.structure.optional')}
                                </Label>
                                <Button
                                    variant='ghost'
                                    size='icon'
                                    onClick={fetchGithubRepos}
                                    disabled={isLoading}
                                >
                                    <RefreshCw
                                        className={cn(
                                            'h-4 w-4',
                                            isLoading && 'animate-spin'
                                        )}
                                    />
                                </Button>
                            </div>
                            <GithubRepos
                                repos={repos}
                                selectedRepo={watch('contestStructure') || ''}
                                setSelectedRepo={(repo) =>
                                    setValue('contestStructure', repo)
                                }
                            />
                            {errors.contestStructure?.message && (
                                <p className='text-red-500'>
                                    {errors.contestStructure.message as string}
                                </p>
                            )}

                            {watch('contestStructure') && (
                                <>
                                    <div className='grid gap-2 mt-4'>
                                        <Label htmlFor='testFramework'>
                                            {t(
                                                'createContest.form.testFramework.label'
                                            )}{' '}
                                            <span className='text-red-500'>
                                                *
                                            </span>
                                        </Label>
                                        <Controller
                                            name='testFramework'
                                            control={control}
                                            rules={{
                                                required:
                                                    'Test framework is required when using a template',
                                            }}
                                            render={({ field }) => (
                                                <Select
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    defaultValue={field.value}
                                                >
                                                    <SelectTrigger id='testFramework'>
                                                        <SelectValue
                                                            placeholder={t(
                                                                'createContest.form.testFramework.placeholder'
                                                            )}
                                                        />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value='jest'>
                                                            Jest
                                                        </SelectItem>
                                                        <SelectItem value='unittest'>
                                                            Unittest
                                                        </SelectItem>
                                                        <SelectItem value='pytest'>
                                                            Pytest
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {errors.testFramework && (
                                            <p className='text-red-500'>
                                                {errors.testFramework.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className='grid gap-2 mt-2'>
                                        <Label htmlFor='test-file'>
                                            {t(
                                                'createContest.form.testFile.label'
                                            )}{' '}
                                            <span className='text-red-500'>
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id='test-files'
                                            type='file'
                                            accept='.js,.py,.ts'
                                            {...register('testFiles', {
                                                required:
                                                    'Test file is required when using a template',
                                            })}
                                        />
                                        {errors.testFiles && (
                                            <p className='text-red-500'>
                                                {
                                                    errors.testFiles
                                                        .message as string
                                                }
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                        <div className='grid gap-2'>
                            <Label htmlFor='rules-files'>
                                {t('createContest.form.rules.label')}{' '}
                                {t('createContest.form.rules.optional')}
                            </Label>
                            <Input
                                id='rules-files'
                                type='file'
                                accept='.pdf'
                                multiple={false}
                                {...register('rulesFile')}
                            />
                            {errors.rulesFile?.message && (
                                <p className='text-red-500'>
                                    {errors.rulesFile.message as string}
                                </p>
                            )}
                        </div>
                        <Button type='submit' className='w-full'>
                            {t('createContest.buttons.create')}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
