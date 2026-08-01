'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProfileService } from '@/lib/services/profile.service';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const redirectUser = () => {
      // Check if user is logged in
      if (!ProfileService.isLoggedIn()) {
        // Not logged in, go to intro screen
        router.push('/bz/auth/intro');
        return;
      }

      // User is logged in, redirect based on role (admin or superadmin only)
      if (ProfileService.isSuperAdmin()) {
        router.push('/bz/superadmin');
      } else if (ProfileService.isAdmin()) {
        router.push('/bz/admin');
      } else {
        // No regular users allowed - redirect to login
        router.push('/bz/auth/intro');
      }
    };

    redirectUser();
  }, [router]);

  return (
    <div className="bg-dark-900 min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-primary rounded-full mx-auto mb-4 animate-pulse"></div>
        <p className="text-white">Loading Clubwiz Admin...</p>
      </div>
    </div>
  );
}
