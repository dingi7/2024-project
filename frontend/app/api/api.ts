import { getSession, signOut } from 'next-auth/react';
import { toast } from '@/components/ui/use-toast';

// const host = 'http://127.0.0.1:3001/api/v1';
const host = 'https://contestify.xyz/api/v1';

interface RequestOptions {
    method: string;
    headers: {
        'Access-Control-Allow-Origin': string;
        'Content-Type'?: string;
        Authorization?: string;
    };
    body?: string | FormData;
}

const appendFormData = (formData: FormData, data: any, parentKey?: string) => {
    for (const key in data) {
        const value = data[key];
        const fullKey = parentKey ? `${parentKey}[${key}]` : key;

        if (value instanceof Date) {
            // If the value is a Date object, convert it to ISO string
            formData.append(fullKey, value.toISOString());
        } else if (Array.isArray(value)) {
            if (value.length === 0) {
                // If it's an empty array, append an empty string
                formData.append(fullKey, '');
            } else if (value.every((x: any) => x instanceof File)) {
                // If it's an array of Files, append each file
                value.forEach((file: File) => {
                    formData.append(fullKey, file);
                });
            } else {
                // For other arrays, stringify the array
                formData.append(fullKey, JSON.stringify(value));
            }
        } else if (value instanceof File) {
            // If the value is a single File
            formData.append(fullKey, value);
        } else if (typeof value === 'object' && value !== null) {
            // If the value is an object (but not a File), recurse
            appendFormData(formData, value, fullKey);
        } else {
            // For primitive values
            formData.append(fullKey, value);
        }
    }
};

export const refreshAccessToken = async (refreshToken: string): Promise<string | null> => {
    const result = await fetch(host + '/auth/refresh', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
    });
    const data = await result.json();
    if(data.status === 401){
        await signOut({ callbackUrl: '/login' });
        toast({
            title: 'Unauthorized',
            description: 'You have been logged out.',
            variant: 'destructive',
        });
        return null;
    }
    if (data.accessToken) {
        // Update the session with the new access token
        const session = await getSession();
        if (session) {
            session.accessToken = data.accessToken;
        }
    }
    return data.accessToken || null;
};

const request = async (
    method: string,
    url: string,
    data?: any,
    isFormData?: boolean
): Promise<any> => {
    let session = await getSession();
    const options: RequestOptions = {
        method,
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
    };
    if (isFormData && data) {
        const formData = new FormData();
        appendFormData(formData, data);
        options.body = formData;
    } else {
        if (data) {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(data);
        }
    }

    if (session?.accessToken) {
        options.headers['Authorization'] = `Bearer ${session.accessToken}`;
    }

    try {
        const res = await fetch(host + url, options);
        const responseData = await res.json();

        if (res.status === 401) {
            await signOut({ callbackUrl: '/login' });
            toast({
                title: 'Unauthorized',
                description: 'You have been logged out.',
                variant: 'destructive',
            });
            throw new Error('Unauthorized');
        }
        if (res.status === 500) {
            toast({
                title: 'Internal Server Error',
                description: 'An error occurred while processing your request.',
                variant: 'destructive',
            });
            throw new Error('Internal Server Error');
        }

        if (!res.ok) {
            const error = new Error(responseData.message || 'Request failed');
            (error as any).response = { status: res.status, data: responseData };
            throw error;
        }

        return responseData;
    } catch (error: any) {
        if (!error.response) {
            // Only show toast for network errors, not for errors we've already handled
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        }
        throw error;
    }
};

const get = request.bind(null, 'GET');
const post = request.bind(null, 'POST');
const put = request.bind(null, 'PUT');
const patch = request.bind(null, 'PATCH');
const del = request.bind(null, 'DELETE');

export { get, post, put, patch, del };
