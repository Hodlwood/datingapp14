'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { applyActionCode } from 'firebase/auth';
import { auth } from '@/lib/firebase/firebase';

export default function VerifyEmail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const oobCode = searchParams.get('oobCode');
        if (!oobCode) {
          throw new Error('No verification code provided');
        }

        // Apply the verification code
        await applyActionCode(auth, oobCode);

        // Reload the user to get the updated email verification status
        if (user) {
          await user.reload();
        }

        // Redirect to onboarding
        router.push('/onboarding');
      } catch (error) {
        console.error('Error verifying email:', error);
        router.push('/signup');
      }
    };

    verifyEmail();
  }, [searchParams, router, user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Verifying your email...
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please wait while we verify your email address.
          </p>
        </div>
      </div>
    </div>
  );
} 