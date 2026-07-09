'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MetricsDashboard() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin?tab=metrics');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-gray-600 bg-gray-50">
      <div className="animate-pulse">Redirecting to Admin Metrics...</div>
    </div>
  );
}
