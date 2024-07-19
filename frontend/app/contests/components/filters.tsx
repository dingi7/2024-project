import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type Props = {};

function Filters({}: Props) {
    return (
        <div className='flex flex-col gap-6 md:w-1/4'>
            <div className='grid gap-2'>
                <label htmlFor='category' className='text-sm font-medium'>
                    Category
                </label>
                <Select>
                    <SelectTrigger>
                        <SelectValue placeholder='Select category' />
                    </SelectTrigger>
                    <SelectContent>
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
                <Input type='date' id='start-date' />
            </div>
            <div className='grid gap-2'>
                <label htmlFor='end-date' className='text-sm font-medium'>
                    End Date
                </label>
                <Input type='date' id='end-date' />
            </div>
            <div className='grid gap-2'>
                <label htmlFor='prize-amount' className='text-sm font-medium'>
                    Prize Amount
                </label>
                <Input type='number' id='prize-amount' placeholder='$0' />
            </div>
        </div>
    );
}

export default Filters;
