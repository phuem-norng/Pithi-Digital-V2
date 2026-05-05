'use client';

import { cn } from '@/lib/utils';
import { Children, type HTMLAttributes, type ReactNode } from 'react';

type MarqueeProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  reverse?: boolean;
  pauseOnHover?: boolean;
  repeat?: number;
};

export function Marquee({
  children,
  className,
  reverse = false,
  pauseOnHover = false,
  repeat = 2,
  ...props
}: MarqueeProps) {
  const items = Children.toArray(children);
  const loops = Array.from({ length: Math.max(2, repeat) });

  return (
    <div className={cn('relative flex w-full overflow-hidden', className)} {...props}>
      <div
        className={cn(
          'flex min-w-max shrink-0 items-stretch gap-4',
          reverse ? 'animate-marquee-reverse' : 'animate-marquee',
          pauseOnHover && 'hover:[animation-play-state:paused]',
        )}
      >
        {loops.map((_, idx) => (
          <div key={idx} className="flex items-stretch gap-4">
            {items}
          </div>
        ))}
      </div>

      <style jsx global>{`
        @keyframes marquee {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(-50%, 0, 0);
          }
        }

        @keyframes marquee-reverse {
          from {
            transform: translate3d(-50%, 0, 0);
          }
          to {
            transform: translate3d(0, 0, 0);
          }
        }

        .animate-marquee {
          animation: marquee var(--duration, 20s) linear infinite;
          will-change: transform;
        }

        .animate-marquee-reverse {
          animation: marquee-reverse var(--duration, 20s) linear infinite;
          will-change: transform;
        }
      `}</style>
    </div>
  );
}
