import React from 'react';
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';

type Props = {
    submissions: any[];
    filterOptions: any;
    onFilterChange: (filters: any) => void;
};

const SubmissionTable = ({ submissions, filterOptions, onFilterChange }: Props) => {
    return (
        <div>
            <h2 className='text-lg font-medium mb-4'>Your Submissions</h2>
            <div className='mb-4'>
                <Label htmlFor='status' className='mr-2'>Filter by status:</Label>
                <Select
                    value={filterOptions.status}
                    onValueChange={(value) =>
                        onFilterChange({ ...filterOptions, status: value })
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder='All' />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value='all'>All</SelectItem>
                        <SelectItem value='Accepted'>Accepted</SelectItem>
                        <SelectItem value='Rejected'>Rejected</SelectItem>
                        <SelectItem value='Pending'>Pending</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className='mb-4'>
                <Label htmlFor='sortBy' className='mr-2'>Sort by:</Label>
                <Select
                    value={filterOptions.sortBy}
                    onValueChange={(value) =>
                        onFilterChange({ ...filterOptions, sortBy: value })
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder='Date' />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value='date'>Date</SelectItem>
                        <SelectItem value='score'>Score</SelectItem>
                    </SelectContent>
                </Select>
                <Select
                    value={filterOptions.order}
                    onValueChange={(value) =>
                        onFilterChange({ ...filterOptions, order: value })
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder='Descending' />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value='asc'>Ascending</SelectItem>
                        <SelectItem value='desc'>Descending</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Score</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {submissions.map((submission) => (
                        <TableRow key={submission.id}>
                            <TableCell>{submission.date}</TableCell>
                            <TableCell>
                                <Badge
                                    variant={
                                        submission.status ? 'success' : 'failure'
                                    }
                                >
                                    {submission.status ? 'Accepted' : 'Rejected'}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {submission.score !== null ? submission.score : '-'}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default SubmissionTable;
