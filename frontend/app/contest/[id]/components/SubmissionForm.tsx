import React, { useState, useEffect, useMemo } from 'react';
import MonacoEditor from '@monaco-editor/react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { PopoverClose } from '@radix-ui/react-popover';
import { useTranslation } from '@/lib/useTranslation';

type Props = {
    onSubmit: (solution: { language: string; code: string }) => Promise<void>;
    selectedRepo: { name: string; clone_url: string };
};

const SubmissionForm = ({ onSubmit, selectedRepo }: Props) => {
    const {t} = useTranslation();
    const [code, setCode] = useState(
        "function main() {\n\tconsole.log('Hello, World!');\n}"
    );
    const [language, setLanguage] = useState('JavaScript');
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editorOptions, setEditorOptions] = useState({
        theme: 'vs-dark',
        language: 'JavaScript',
    });

    const languages = useMemo(() => [
        { value: 'JavaScript', monacoValue: 'javascript', label: 'JavaScript' },
        { value: 'Python', monacoValue: 'python', label: 'Python' },
        { value: 'Java', monacoValue: 'java', label: 'Java' },
        { value: 'C++', monacoValue: 'cpp', label: 'C++' },
        { value: 'C#', monacoValue: 'csharp', label: 'C#' },
    ], []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const solution = {
            language: language,
            code: code,
        };
        try {
            await onSubmit(solution);
            setIsOpen(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        const selectedLanguage = languages.find((l) => l.value === language);
        if (!selectedLanguage) {
            throw new Error('Language is required');
        }

        setEditorOptions({
            theme: 'vs-dark',
            language: selectedLanguage.monacoValue,
        });
    }, [language, languages]);

    const handleRepoSubmit = async () => {
        setIsSubmitting(true);
        const solution = {
            language: 'Repository',
            code: selectedRepo.clone_url,
        };
        try {
            await onSubmit(solution);
            setIsOpen(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (selectedRepo) {
        return (
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button>{t('contestPage.submission.submitRepo')}</Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-4">
                    <h2 className="text-lg font-medium mb-4">{t('contestPage.submission.submitRepo')}</h2>
                    <p className="mb-4">
                        {t('contestPage.submission.submitRepoConfirm')}
                    </p>
                    <div className="flex justify-end space-x-2">
                        <PopoverClose asChild>
                            <Button variant="outline" disabled={isSubmitting}>{t('common.cancel')}</Button>
                        </PopoverClose>
                        <Button onClick={handleRepoSubmit} disabled={isSubmitting}>
                            {isSubmitting ? t('common.submitting') : t('common.submit')}
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        );
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button>Submit New Solution</Button>
            </PopoverTrigger>
            <PopoverContent className='w-[800px] p-4'>
                <h2 className='text-lg font-medium mb-4'>Submit Solution</h2>
                <form onSubmit={handleSubmit}>
                    <div className='mb-4'>
                        <Label htmlFor='language'>Language</Label>
                        <Select
                            name='language'
                            value={language}
                            onValueChange={(value) => setLanguage(value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder='Select language' />
                            </SelectTrigger>
                            <SelectContent>
                                {languages.map((lang) => (
                                    <SelectItem key={lang.value} value={lang.value}>
                                        {lang.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className='mb-4'>
                        <Label htmlFor='code'>Code</Label>
                        <MonacoEditor
                            height="400px"
                            width="100%"
                            value={code}
                            theme={editorOptions.theme}
                            language={editorOptions.language}
                            onChange={(value) => setCode(value || '')}
                            options={{
                                automaticLayout: true,
                                fontSize: 14,
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                wordWrap: 'on',
                                tabSize: 2,
                            }}
                        />
                    </div>
                    <Button type='submit' disabled={isSubmitting} className='w-full'>
                        {isSubmitting ? 'Submitting...' : 'Submit'}
                    </Button>
                </form>
            </PopoverContent>
        </Popover>
    );
};

export default SubmissionForm;
