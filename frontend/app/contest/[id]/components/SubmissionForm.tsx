import React, { useState, useEffect } from 'react';
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
// Removed the import for AlertDialog components due to the error

type Props = {
    onSubmit: (solution: { language: string; code: string }) => void;
    selectedRepo: { name: string; url: string };
};

const SubmissionForm = ({ onSubmit, selectedRepo }: Props) => {
    const [code, setCode] = useState(
        "function main() {\n\tconsole.log('Hello, World!');\n}"
    );
    const [language, setLanguage] = useState('JavaScript');
    const [isOpen, setIsOpen] = useState(false);
    const [editorOptions, setEditorOptions] = useState({
        theme: 'vs-dark',
        language: 'JavaScript',
    });

    const languages = [
        { value: 'JavaScript', monacoValue: 'javascript', label: 'JavaScript' },
        { value: 'Python', monacoValue: 'python', label: 'Python' },
        { value: 'Java', monacoValue: 'java', label: 'Java' },
        { value: 'C++', monacoValue: 'cpp', label: 'C++' },
        { value: 'C#', monacoValue: 'csharp', label: 'C#' },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const solution = {
            language: language,
            code: code,
        };
        onSubmit(solution);
        setIsOpen(false);
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
    }, [language]);

    const handleRepoSubmit = () => {
        const solution = {
            language: 'Repository',
            code: selectedRepo.url,
        };
        onSubmit(solution);
    };

    if (selectedRepo) {
        return (
            <Popover>
                <PopoverTrigger asChild>
                    <Button>Submit Repository Solution</Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-4">
                    <h2 className="text-lg font-medium mb-4">Submit Repository as Solution</h2>
                    <p className="mb-4">
                        Are you sure you want to submit the repository "{selectedRepo.name}" as your solution?
                    </p>
                    <div className="flex justify-end space-x-2">
                        <PopoverClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </PopoverClose>
                        <Button onClick={handleRepoSubmit}>Submit Repository</Button>
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
                    <Button type='submit' className='w-full'>
                        Submit
                    </Button>
                </form>
            </PopoverContent>
        </Popover>
    );
};

export default SubmissionForm;
