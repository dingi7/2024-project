import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('JavaScript');

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button>Submit New Solution</Button>
            </PopoverTrigger>
            <PopoverContent className='w-[400px] p-4'>
                <h2 className='text-lg font-medium mb-4'>Submit Solution</h2>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        const solution = {
                            language: language,
                            code: code,
                        };
                        onSubmit(solution);
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

                        <Textarea
                            id='code'
                            name='code'
                            rows={10}
                            className='resize-none'
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
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
