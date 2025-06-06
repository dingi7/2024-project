import React, { useState, ChangeEvent } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { TestCase } from '@/lib/types';
import { addTestCase, deleteTestCase, editTestCase } from '@/app/api/requests';
import { Checkbox } from '@/components/ui/checkbox';

interface ContestTestCasesProps {
    contestId: string;
    dbTestCases: TestCase[];
    saveContestTestCase: (testCase: TestCase, action: 'delete' | 'add' | 'edit') => void;
}

export default function ContestTestCases({
    contestId,
    dbTestCases,
    saveContestTestCase,
}: ContestTestCasesProps) {
    const [testCases, setTestCases] = useState<TestCase[] | []>(
        dbTestCases || []
    );
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newTestCase, setNewTestCase] = useState<TestCase>({
        id: '0',
        input: '',
        output: '',
        timeLimit: 0,
        public: true,
        memoryLimit: 0,
    });

    const handleEdit = (id: string) => {
        setEditingId(id);
    };

    const handleSave = (id: string) => {
        setEditingId(null);
        const savedTestCase = testCases.find((test) => test.id === id);
        if (savedTestCase) {
            editTestCase(contestId, savedTestCase)
                .then(response => {
                    // Update the parent component's state with a single edit action
                    saveContestTestCase(savedTestCase, 'edit');
                })
                .catch(error => {
                    console.error('Failed to edit test case:', error);
                });
        }
    };

    const handleDelete = (testCase: TestCase) => {
        deleteTestCase(contestId, testCase.id.toString());
        setTestCases(testCases.filter((test) => test.id !== testCase.id));
        saveContestTestCase(testCase, 'delete');
    };
    const handleInputChange = (
        id: string,
        field: keyof TestCase,
        value: string | number
    ) => {
        if (field === 'timeLimit' || field === 'memoryLimit') {
            const numValue = parseInt(value as string);
            if (isNaN(numValue)) {
                return;
            }
            value = numValue;
        }
        setTestCases(
            testCases.map((testCase) =>
                testCase.id === id ? { ...testCase, [field]: value } : testCase
            )
        );
    };
    const handleChangePublic = (id: string, checked: boolean) => {
        setTestCases(
            testCases.map((testCase) =>
                testCase.id === id ? { ...testCase, public: checked } : testCase
            )
        );
    };

    const handleNewTestCaseChange = (field: keyof TestCase, value: string) => {
        if (field === 'timeLimit' || field === 'memoryLimit') {
            const numValue = parseInt(value);
            if (isNaN(numValue)) {
                return;
            }
            setNewTestCase({ ...newTestCase, [field]: numValue });
        } else {
            setNewTestCase({ ...newTestCase, [field]: value });
        }
    };

    const handleAddTestCase = async () => {
        const response = await addTestCase(contestId, {
            input: newTestCase.input,
            output: newTestCase.output,
            timeLimit: newTestCase.timeLimit,
            memoryLimit: newTestCase.memoryLimit,
            public: true,
        });
        setTestCases([...testCases, response]);
        saveContestTestCase(response, 'add');
        setNewTestCase({
            id: '0',
            input: '',
            output: '',
            timeLimit: 0,
            public: true,
            memoryLimit: 0,
        });
    };

    return (
        <div className='p-4'>
            <h2 className='text-2xl font-bold mb-4'>Test Cases</h2>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Input</TableHead>
                        <TableHead>Output</TableHead>
                        <TableHead>Time Limit (ms)</TableHead>
                        <TableHead>Memory Limit (MB)</TableHead>
                        <TableHead>Visibility</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {testCases?.map((testCase) => (
                        <TableRow key={testCase.id}>
                            <TableCell>
                                {editingId === testCase.id ? (
                                    <Input
                                        value={testCase.input}
                                        onChange={(
                                            e: ChangeEvent<HTMLInputElement>
                                        ) =>
                                            handleInputChange(
                                                testCase.id,
                                                'input',
                                                e.target.value
                                            )
                                        }
                                    />
                                ) : (
                                    testCase.input
                                )}
                            </TableCell>
                            <TableCell>
                                {editingId === testCase.id ? (
                                    <Input
                                        value={testCase.output}
                                        onChange={(
                                            e: ChangeEvent<HTMLInputElement>
                                        ) =>
                                            handleInputChange(
                                                testCase.id,
                                                'output',
                                                e.target.value
                                            )
                                        }
                                    />
                                ) : (
                                    testCase.output
                                )}
                            </TableCell>
                            <TableCell>
                                {editingId === testCase.id ? (
                                    <Input
                                        value={testCase.timeLimit}
                                        onChange={(
                                            e: ChangeEvent<HTMLInputElement>
                                        ) =>
                                            handleInputChange(
                                                testCase.id,
                                                'timeLimit',
                                                e.target.value
                                            )
                                        }
                                    />
                                ) : (
                                    testCase.timeLimit
                                )}
                            </TableCell>
                            <TableCell>
                                {editingId === testCase.id ? (
                                    <Input
                                        value={testCase.memoryLimit}
                                        onChange={(
                                            e: ChangeEvent<HTMLInputElement>
                                        ) =>
                                            handleInputChange(
                                                testCase.id,
                                                'memoryLimit',
                                                e.target.value
                                            )
                                        }
                                    />
                                ) : (
                                    testCase.memoryLimit
                                )}
                            </TableCell>
                            <TableCell>
                                {editingId === testCase.id ? (
                                    <div className='flex items-center'>
                                        <Checkbox
                                            id={`public-checkbox-${testCase.id}`}
                                            checked={testCase.public}
                                            onCheckedChange={(checked) =>
                                                handleChangePublic(
                                                    testCase.id,
                                                    checked as boolean
                                                )
                                            }
                                        />
                                        <label
                                            htmlFor={`public-checkbox-${testCase.id}`}
                                        >
                                            {testCase.public
                                                ? 'Public'
                                                : 'Private'}
                                        </label>
                                    </div>
                                ) : (
                                    testCase.public ? 'Public' : 'Private'
                                )}
                            </TableCell>
                            <TableCell>
                                {editingId === testCase.id ? (
                                    <Button onClick={() => handleSave(testCase.id)}>
                                        Save
                                    </Button>
                                ) : (
                                    <div className='flex gap-2'>
                                        <Button
                                            variant='ghost'
                                            size='icon'
                                            onClick={() => handleEdit(testCase.id)}
                                        >
                                            <Pencil className='h-4 w-4' />
                                        </Button>
                                        <Button
                                            variant='ghost'
                                            size='icon'
                                            onClick={() => handleDelete(testCase)}
                                        >
                                            <Trash2 className='h-4 w-4' />
                                        </Button>
                                    </div>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <div className='mt-4'>
                <h3 className='text-xl font-semibold mb-2'>Add New Test Case</h3>
                <div className='grid grid-cols-2 gap-4'>
                    <div>
                        <label className='block text-sm font-medium mb-1'>
                            Input
                        </label>
                        <Input
                            value={newTestCase.input}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                handleNewTestCaseChange('input', e.target.value)
                            }
                        />
                    </div>
                    <div>
                        <label className='block text-sm font-medium mb-1'>
                            Output
                        </label>
                        <Input
                            value={newTestCase.output}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                handleNewTestCaseChange('output', e.target.value)
                            }
                        />
                    </div>
                    <div>
                        <label className='block text-sm font-medium mb-1'>
                            Time Limit (ms)
                        </label>
                        <Input
                            type='number'
                            value={newTestCase.timeLimit}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                handleNewTestCaseChange('timeLimit', e.target.value)
                            }
                        />
                    </div>
                    <div>
                        <label className='block text-sm font-medium mb-1'>
                            Memory Limit (MB)
                        </label>
                        <Input
                            type='number'
                            value={newTestCase.memoryLimit}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                handleNewTestCaseChange('memoryLimit', e.target.value)
                            }
                        />
                    </div>
                </div>
                <Button
                    className='mt-4'
                    onClick={handleAddTestCase}
                    disabled={!newTestCase.input || !newTestCase.output}
                >
                    <Plus className='h-4 w-4 mr-2' />
                    Add Test Case
                </Button>
            </div>
        </div>
    );
};
