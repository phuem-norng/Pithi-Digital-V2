import { Assets } from '@/lib/assets';

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={Assets.loadingMascot}
          alt="Loading mascot"
          className="mx-auto h-44 w-auto object-contain sm:h-52"
        />
        <span className="loader mt-4" aria-hidden="true" />
        <p className="mt-5 font-khmer-heading text-4xl text-slate-900 sm:text-5xl">
          រងចាំបន្តិចមេ!
        </p>
        <p className="mt-3 text-sm text-slate-500 sm:text-base">
          កំពុងផ្ទុកទិន្នន័យ... បើអ៊ីនធឺណិតយឺត សូមរង់ចាំបន្តិច។
        </p>
      </div>
    </div>
  );
}
