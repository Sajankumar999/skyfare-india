import { useState, useEffect } from 'react';

/**
 * Custom hook to detect mobile viewport (< breakpoint px).
 * Defaults to 640px (Tailwind 'sm' breakpoint).
 */
export function useIsMobile(breakpoint = 640): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < breakpoint;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkSize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, [breakpoint]);

  return isMobile;
}
