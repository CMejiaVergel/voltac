"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname?.startsWith('/admin')) return; // No trackear admin

    const startTime = Date.now();
    let isTracking = true;

    const trackPageview = () => {
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'page_view', path: pathname || '/' }),
        keepalive: true
      }).catch(() => {});
    };

    const trackDuration = () => {
      if (!isTracking) return;
      isTracking = false;
      const durationSec = Math.floor((Date.now() - startTime) / 1000);
      if (durationSec > 1) { // Solo si estuvo más de 1 segundo
        fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'time_spent', path: pathname || '/', duration: durationSec }),
          keepalive: true
        }).catch(() => {});
      }
    };

    trackPageview();

    window.addEventListener('beforeunload', trackDuration);
    return () => {
      trackDuration();
      window.removeEventListener('beforeunload', trackDuration);
    };
  }, [pathname]);

  return null;
}
