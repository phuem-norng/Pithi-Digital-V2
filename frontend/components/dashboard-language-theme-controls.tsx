'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import { useLanguage } from '@/lib/language-context';

export function DashboardLanguageThemeControls() {
  const { language, setLanguage } = useLanguage();
  const isKhmer = language === 'km';
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const languageMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLanguageMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(e.target as Node)) {
        setIsLanguageMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [isLanguageMenuOpen]);

  return (
    <>
      <AnimatedThemeToggler
        variant="circle"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
      />
      <div className="relative" ref={languageMenuRef}>
        <button
          type="button"
          onClick={() => setIsLanguageMenuOpen((prev) => !prev)}
          className="inline-flex h-9 items-center rounded-full border border-gray-200 bg-white px-2.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          aria-expanded={isLanguageMenuOpen}
          aria-label="Language selector"
        >
          {isKhmer ? 'ខ្មែរ' : 'EN'}
        </button>
        {isLanguageMenuOpen && (
          <div className="absolute right-0 top-[calc(100%+0.4rem)] z-50 min-w-[88px] rounded-xl border border-gray-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => {
                setLanguage('km');
                setIsLanguageMenuOpen(false);
              }}
              className={`block w-full rounded-md px-2.5 py-1.5 text-left text-xs font-semibold transition ${isKhmer ? 'bg-rose-500 text-white' : 'text-gray-700 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800'}`}
            >
              ខ្មែរ
            </button>
            <button
              type="button"
              onClick={() => {
                setLanguage('en');
                setIsLanguageMenuOpen(false);
              }}
              className={`block w-full rounded-md px-2.5 py-1.5 text-left text-xs font-semibold transition ${!isKhmer ? 'bg-rose-500 text-white' : 'text-gray-700 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800'}`}
            >
              EN
            </button>
          </div>
        )}
      </div>
    </>
  );
}
