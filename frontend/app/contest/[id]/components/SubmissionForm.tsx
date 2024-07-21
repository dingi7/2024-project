import React from 'react';
import { Button } from '@/components/ui/button';

type Props = {
    onSubmit: (solution: any) => void;
};

const SubmissionForm = ({ onSubmit }: Props) => {
    return (
        <Button onClick={() => onSubmit({})}>Submit New Solution</Button>
    );
};

export default SubmissionForm;
