import React, { useState } from 'react';
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

type Props = {
    onSubmit: (solution: { language: string; code: string }) => void;
};

const SubmissionForm = ({ onSubmit }: Props) => {
    const [code, setCode] = useState(
        "function main() {\n\tconsole.log('Hello, World!');\n}"
    );
    const [language, setLanguage] = useState('javascript');
    const [isOpen, setIsOpen] = useState(false);

    const getLanguageMode = (lang: string) => {
        switch (lang) {
            case 'JavaScript':
                return 'javascript';
            case 'Python':
                return 'python';
            case 'Java':
                return 'java';
            case 'C++':
                return 'cpp';
            case 'C#':
                return 'csharp';
            default:
                return 'javascript';
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const solution = {
            language: language,
            code: code,
        };
        onSubmit(solution);
        setIsOpen(false);
    };

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
                                <SelectItem value='javascript'>JavaScript</SelectItem>
                                <SelectItem value='python'>Python</SelectItem>
                                <SelectItem value='java'>Java</SelectItem>
                                <SelectItem value='cpp'>C++</SelectItem>
                                <SelectItem value='csharp'>C#</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className='mb-4'>
                        <Label htmlFor='code'>Code</Label>
                        <MonacoEditor
                            height="400px"
                            width="100%"
                            language={getLanguageMode(language)}
                            theme="vs-dark"
                            value={code}
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
