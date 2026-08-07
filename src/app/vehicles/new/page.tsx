'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VehiclesNewRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/v/new');
  }, [router]);

  return null;
}
