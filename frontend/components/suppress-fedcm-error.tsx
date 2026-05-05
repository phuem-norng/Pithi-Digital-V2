'use client';

import { useEffect } from 'react';

export function SuppressFedCMError() {
  useEffect(() => {
    const original = console.error.bind(console);
    console.error = (...args: unknown[]) => {
      const msg = typeof args[0] === 'string' ? args[0] : '';
      if (msg.includes('FedCM') || msg.includes('GSI_LOGGER')) return;
      original(...args);
    };
    return () => {
      console.error = original;
    };
  }, []);

  return null;
}
