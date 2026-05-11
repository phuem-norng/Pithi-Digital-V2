'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

import { cn } from '@/lib/utils';

export type TransitionVariant =
  | 'circle'
  | 'square'
  | 'triangle'
  | 'diamond'
  | 'hexagon'
  | 'rectangle'
  | 'star';

interface AnimatedThemeTogglerProps extends React.ComponentPropsWithoutRef<'button'> {
  /** Kept for API compatibility; theme swap is instant on all devices. */
  duration?: number;
  variant?: TransitionVariant;
  fromCenter?: boolean;
}

function applyThemeWithoutTransitions(callback: () => void): void {
  const root = document.documentElement;
  root.classList.add('theme-switch-no-transitions');
  callback();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      root.classList.remove('theme-switch-no-transitions');
    });
  });
}

export function AnimatedThemeToggler({ className, ...props }: AnimatedThemeTogglerProps) {
  const [isDark, setIsDark] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('theme') : null;
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (saved === 'light') {
      document.documentElement.classList.remove('dark');
    }
    setIsDark(document.documentElement.classList.contains('dark'));

    const updateTheme = () => setIsDark(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const toggleTheme = useCallback(() => {
    const applyTheme = () => {
      const nextDark = !document.documentElement.classList.contains('dark');
      document.documentElement.classList.toggle('dark', nextDark);
      localStorage.setItem('theme', nextDark ? 'dark' : 'light');
      setIsDark(nextDark);
    };
    applyThemeWithoutTransitions(applyTheme);
  }, []);

  return (
    <button type="button" ref={buttonRef} onClick={toggleTheme} className={cn(className)} {...props}>
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
