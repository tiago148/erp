'use client';

import { useEffect, useState } from 'react';

export function usePrint<T>() {
  const [printing, setPrinting] = useState<T | undefined>();
  useEffect(() => {
    if (!printing) return;
    const t = setTimeout(() => window.print(), 100);
    const onAfterPrint = () => setPrinting(undefined);
    window.addEventListener('afterprint', onAfterPrint);
    return () => { clearTimeout(t); window.removeEventListener('afterprint', onAfterPrint); };
  }, [printing]);
  return [printing, setPrinting] as const;
}
