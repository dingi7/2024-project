import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ContestFilters } from '@/lib/types';

type Props = {
    onFilterChange: (filters: ContestFilters) => void;
};

function Filters({ onFilterChange }: Props) {
    const [category, setCategory] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [prizeAmount, setPrizeAmount] = useState('');

    useEffect(() => {
        handleFilterChange();
    }, [category, startDate, endDate, prizeAmount]);

    const handleFilterChange = () => {
        onFilterChange({
            category,
            startDate,
            endDate,
            prizeAmount,
        });
    };

    return (
        <div className='flex flex-col gap-6 md:w-1/4'>
            <div className='grid gap-2'>
                <label htmlFor='category' className='text-sm font-medium'>
                    Category
                </label>
                <Select
                    value={category}
                    onValueChange={(value) => setCategory(value)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder='Select category' />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value='all'>All</SelectItem>
                        <SelectItem value='art'>Art</SelectItem>
                        <SelectItem value='design'>Design</SelectItem>
                        <SelectItem value='photography'>Photography</SelectItem>
                        <SelectItem value='writing'>Writing</SelectItem>
                        <SelectItem value='music'>Music</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className='grid gap-2'>
                <label htmlFor='start-date' className='text-sm font-medium'>
                    Start Date
                </label>
                <Input
                    type='date'
                    id='start-date'
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                />
            </div>
            <div className='grid gap-2'>
                <label htmlFor='end-date' className='text-sm font-medium'>
                    End Date
                </label>
                <Input
                    type='date'
                    id='end-date'
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                />
            </div>
            <div className='grid gap-2'>
                <label htmlFor='prize-amount' className='text-sm font-medium'>
                    Prize Amount
                </label>
                <Input
                    type='number'
                    id='prize-amount'
                    value={prizeAmount}
                    onChange={(e) => setPrizeAmount(e.target.value)}
                    placeholder='$0'
                />
            </div>
        </div>
    );
}

export default Filters;
