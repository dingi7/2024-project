// utils/auth.ts
import { getSession, signOut as nextAuthSignOut } from 'next-auth/react';

export const signOut = async () => {
    // Perform any actions before signing out (e.g., notify your backend)
    const session = await getSession();
    const accessToken = session?.accessToken;

    try {
        const response = await fetch('https://your-backend-server.com/api/signout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to notify backend about sign out');
        }

        const data = await response.json();
        console.log('Backend response:', data);
    } catch (error) {
        console.error('Error notifying backend about sign out:', error);
    }

    // Call next-auth's signOut function
    nextAuthSignOut();
};