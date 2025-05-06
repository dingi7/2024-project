'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { acceptAdminInvite } from '@/app/api/requests';

const AcceptInvitePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (status === 'loading') return;
    if (!token) {
      setError('No invite token found in the URL.');
      return;
    }
    if (!session) {
      signIn();
      return;
    }

    const accept = async () => {
      setLoading(true);
      setError(null);
      setMessage(null);
      try {
        const res = await acceptAdminInvite(token);
        setMessage(res.message || 'You are now an admin!');
      } catch (e: any) {
        setError(e?.response?.data?.error || e?.message || 'Failed to accept invite.');
      } finally {
        setLoading(false);
      }
    };

    accept();
  }, [status, session, token]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4 text-center">Accept Admin Invite</h1>
        {loading && <p className="text-blue-600 text-center">Processing your invite...</p>}
        {message && (
          <div className="text-green-600 text-center mb-4">{message}</div>
        )}
        {error && (
          <div className="text-red-600 text-center mb-4">{error}</div>
        )}
        <button
          className="mt-6 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          onClick={() => router.push('/')}
        >
          Go to Home
        </button>
      </div>
    </div>
  );
};

export default AcceptInvitePage; 