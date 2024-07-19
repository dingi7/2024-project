import Link from 'next/link';

type Props = {
    name: string;
    description: string;
    link: string;
};

function Contest({ name, description, link = '#' }: Props) {
    return (
        <div className='flex items-center gap-4 bg-background p-4 rounded-lg shadow-sm'>
            <div className='flex-1'>
                <h3 className='text-lg font-semibold'>{name}</h3>
                <p className='text-muted-foreground'>{description}</p>
            </div>
            <Link
                href={link}
                className='inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'
                prefetch={false}
            >
                More Info
            </Link>
        </div>
    );
}

export default Contest;
