import { getSession } from 'next-auth/react';
import { toast } from '@/components/ui/use-toast';

const host = process.env.ENVIRONMENT === 'production'
    ? 'http://188.34.162.248/api/v1'
    : 'http://127.0.0.1:3001/api/v1';

interface RequestOptions {
    method: string;
    headers: {
        'Access-Control-Allow-Origin': string;
        'Content-Type'?: string;
        Authorization?: string;
    };
    body?: string;
}

const request = async (
    method: string,
    url: string,
    data?: any
): Promise<any> => {
    const session = await getSession();
    const options: RequestOptions = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
    };

    if (data) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(data);
    }

    if (session?.accessToken) {
        options.headers['Authorization'] = `Bearer ${session.accessToken}`;
    }

    try {
        const res = await fetch(host + url, options);
        const responseData = await res.json();

        if (res.status === 401) {
            const { signOut } = await import('next-auth/react');
            await signOut({ callbackUrl: '/login' });
            toast({
                title: "Unauthorized",
                description: "You have been logged out.",
                variant: "destructive",
            });
            return;
        }

        if (!res.ok) {
            toast({
                title: "Error",
                description: responseData.message,
                variant: "destructive",
            });
            return;
        }

        return responseData;
    } catch (error: any) {
        toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
        });
        return;
    }
};

const get = request.bind(null, 'GET');
const post = request.bind(null, 'POST');
const put = request.bind(null, 'PUT');
const patch = request.bind(null, 'PATCH');
const del = request.bind(null, 'DELETE');

export { get, post, put, patch, del };
