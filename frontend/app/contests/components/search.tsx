import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Props = {};

function Search(props: Props) {
    return (
        <div className='flex items-center gap-4 mb-6'>
            <Input
                type='search'
                placeholder='Search contests...'
                className='flex-1'
            />
            <Button>Search</Button>
        </div>
    );
}

export default Search;
