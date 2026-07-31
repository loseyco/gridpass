'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminBusinessPlanRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/users');
  }, [router]);

  return (
    <div className="p-8 text-center font-sans">
      <p className="text-sm font-bold text-neutral-600">Redirecting to Members &amp; Clients...</p>
    </div>
  );
}
