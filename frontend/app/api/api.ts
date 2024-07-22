"use client"

import { getServerSession } from "next-auth";

const host = "http://localhost:3001/api/v1";

interface RequestOptions {
    method: string;
    headers: {
        'Access-Control-Allow-Origin': string;
        'content-type'?: string;
        'x-authorization'?: string;
    };
    body?: string;
}

// const auth = useAuthUser();
// const user = auth()!;

const request = async (
    method: string,
    url: string,
    data?: any
): Promise<any> => {
    const session = await getServerSession();

    const options: RequestOptions = {
        method,
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
    };

    if (data) {
        options.headers['content-type'] = 'application/json';
        options.body = JSON.stringify(data);
    }

    if (session?.accessToken) {
        const token = session.accessToken;
        options.headers['x-authorization'] = token;
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
