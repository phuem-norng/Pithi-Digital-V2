'use client';

import { Assets } from '@/lib/assets';

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ reset }: ErrorProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={Assets.loadingMascot}
          alt="Error mascot"
          className="mx-auto h-44 w-auto object-contain sm:h-52"
        />
        <span className="loader mt-4" aria-hidden="true" />
        <p className="mt-5 font-khmer-heading text-4xl text-slate-900 sm:text-5xl">
          មានបញ្ហាបន្តិចមេ!
        </p>
        <p className="mt-3 text-sm text-slate-500 sm:text-base">
          មានបញ្ហាបន្តិចក្នុងការផ្ទុក។ សូមចុចប៊ូតុងខាងក្រោមដើម្បីសាកល្បងម្ដងទៀត។
        </p>

        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-full bg-amber-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700"
        >
          សាកល្បងម្ដងទៀត
        </button>
      </div>
    </div>
  );
}
