'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SimCenterPartnerRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/srcommander');
  }, [router]);

  return null;
}
