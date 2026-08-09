'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EditDriverProfilePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dash/edit-profile');
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 text-center font-mono text-sm text-neutral-500">
      Redirecting to Profile Editor...
    </div>
  );
}
