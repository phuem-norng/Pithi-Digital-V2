'use client';

import confetti from 'canvas-confetti';
import { useEffect, useRef } from 'react';

export function ConfettiSideCannons() {
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (hasTriggeredRef.current) {
      return;
    }
    hasTriggeredRef.current = true;

    const end = Date.now() + 3 * 1000;
    const colors = ['#a786ff', '#fd8bbc', '#eca184', '#f8deb1'];
    let rafId = 0;

    const frame = () => {
      if (Date.now() > end) return;

      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        startVelocity: 60,
        origin: { x: 0, y: 0.5 },
        colors,
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        startVelocity: 60,
        origin: { x: 1, y: 0.5 },
        colors,
      });

      rafId = requestAnimationFrame(frame);
    };

    frame();
    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return null;
}
