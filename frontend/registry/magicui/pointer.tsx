'use client';

import { cn } from '@/lib/utils';
import { motion, useSpring } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

type PointerProps = {
  children?: ReactNode;
  className?: string;
};

export function Pointer({ children, className }: PointerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const x = useSpring(0, { stiffness: 180, damping: 28, mass: 0.7 });
  const y = useSpring(0, { stiffness: 180, damping: 28, mass: 0.7 });

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (!isVisible) {
        setIsVisible(true);
      }
      x.set(event.clientX);
      y.set(event.clientY);
    };

    const onLeave = () => setIsVisible(false);

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
    };
  }, [isVisible, x, y]);

  return (
    <motion.div
      aria-hidden="true"
      className={cn(
        'pointer-events-none fixed left-0 top-0 z-[100] hidden will-change-transform md:block',
        isVisible ? 'opacity-100' : 'opacity-0',
      )}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      style={{ x, y }}
    >
      <div className="-translate-x-1/2 -translate-y-1/2">
        {children ?? (
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            className={cn('fill-rose-500 drop-shadow-sm', className)}
          >
            <path d="M4 3.5C4 2.67 4.67 2 5.5 2C5.95 2 6.37 2.2 6.65 2.54L13.34 10.73L20.2 12.69C20.88 12.88 21.35 13.49 21.35 14.2C21.35 14.95 20.77 15.57 20.03 15.61L14.73 15.9L13.62 21.08C13.48 21.74 12.9 22.2 12.23 22.2C11.58 22.2 11.01 21.76 10.85 21.12L4.05 4.41C4.02 4.31 4 4.2 4 4.1V3.5Z" />
          </svg>
        )}
      </div>
    </motion.div>
  );
}
