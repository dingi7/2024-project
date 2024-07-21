import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type Props = {
    contest: any;
    isOwner: boolean;
    isEditEnabled: boolean;
    onEdit: (updatedContest: any) => void;
};

const ContestDetails = ({ contest, isOwner, isEditEnabled, onEdit }: Props) => {
    const handleEditContest = (e: any) => {
        e.preventDefault();
        onEdit({
            ...contest,
            title: 'Updated Contest Title',
            description: 'Updated contest description',
        });
    };

    return (
        <div>
            <h1 className='text-2xl font-bold mb-4'>{contest.title}</h1>
            <p className='text-muted-foreground mb-4'>{contest.description}</p>
            <div className='grid grid-cols-2 gap-4 mb-4'>
                <div>
                    <h3 className='text-sm font-medium mb-1'>Start Date</h3>
                    <p>{contest.startDate}</p>
                </div>
                <div>
                    <h3 className='text-sm font-medium mb-1'>End Date</h3>
                    <p>{contest.endDate}</p>
                </div>
                <div>
                    <h3 className='text-sm font-medium mb-1'>Prize</h3>
                    <p>{contest.prize}</p>
                </div>
            </div>
            {isOwner && isEditEnabled && (
                <div className='mt-8'>
                    <h2 className='text-lg font-medium mb-4'>Edit Contest</h2>
                    <form onSubmit={handleEditContest}>
                        <div className='grid grid-cols-2 gap-4 mb-4'>
                            <div>
                                <Label htmlFor='title'>Title</Label>
                                <Input id='title' defaultValue={contest.title} required />
                            </div>
                            <div>
                                <Label htmlFor='description'>Description</Label>
                                <Textarea id='description' defaultValue={contest.description} required />
                            </div>
                        </div>
                        <div className='grid grid-cols-2 gap-4 mb-4'>
                            <div>
                                <Label htmlFor='startDate'>Start Date</Label>
                                <Input id='startDate' type='date' defaultValue={contest.startDate} required />
                            </div>
                            <div>
                                <Label htmlFor='endDate'>End Date</Label>
                                <Input id='endDate' type='date' defaultValue={contest.endDate} required />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor='prize'>Prize</Label>
                            <Input id='prize' defaultValue={contest.prize} required />
                        </div>
                        <Button type='submit' className='mt-4'>Save Changes</Button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ContestDetails;
