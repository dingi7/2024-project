import { getSession } from 'next-auth/react';

const host =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3001/api/v1';

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

        if (!res.ok) {
            throw new Error(responseData.message);
        }

        return responseData;
    } catch (error: any) {
        throw new Error(error.message);
    }
};

const get = request.bind(null, 'GET');
const post = request.bind(null, 'POST');
const put = request.bind(null, 'PUT');
const patch = request.bind(null, 'PATCH');
const del = request.bind(null, 'DELETE');

export { get, post, put, patch, del };
