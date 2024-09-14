import React, { useState } from 'react';
import AceEditor from 'react-ace';

import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/mode-java';
import 'ace-builds/src-noconflict/mode-c_cpp';
import 'ace-builds/src-noconflict/mode-csharp';
import 'ace-builds/src-noconflict/theme-monokai';

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
    onSubmit: (solution: any) => void;
};

const SubmissionForm = ({ onSubmit }: Props) => {
    const [code, setCode] = useState(
        "function main() {\n\tconsole.log('Hello, World!');\n}"
    );
    const [language, setLanguage] = useState('JavaScript');
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
                return 'c_cpp';
            case 'C#':
                return 'csharp';
            default:
                return 'javascript';
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button>Submit New Solution</Button>
            </PopoverTrigger>
            <PopoverContent className='w-[600px] p-4'>
                <h2 className='text-lg font-medium mb-4'>Submit Solution</h2>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        const solution = {
                            language: language,
                            code: code,
                        };
                        onSubmit(solution);
                        setIsOpen(false); // Close the popover after submission
                    }}
                >
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
                                <SelectItem value='JavaScript'>
                                    JavaScript
                                </SelectItem>
                                <SelectItem value='Python'>Python</SelectItem>
                                <SelectItem value='Java'>Java</SelectItem>
                                <SelectItem value='C++'>C++</SelectItem>
                                <SelectItem value='C#'>C#</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className='mb-4'>
                        <Label htmlFor='code'>Code</Label>
                        <AceEditor
                            mode={getLanguageMode(language)}
                            theme='monokai'
                            onChange={setCode}
                            name='code-editor'
                            editorProps={{ $blockScrolling: true }}
                            value={code}
                            width='100%'
                            height='300px'
                            fontSize={14}
                            showPrintMargin={false}
                            showGutter={true}
                            highlightActiveLine={true}
                            setOptions={{
                                enableBasicAutocompletion: true,
                                enableLiveAutocompletion: true,
                                enableSnippets: false,
                                showLineNumbers: true,
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
