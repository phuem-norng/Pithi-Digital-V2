'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { EVENT_CATEGORY_OPTIONS } from '@/lib/event-categories';
import {
  ArrowLeft,
  ArrowRight,
  Cake,
  Gift,
  House,
  Heart,
  MessageCircle,
  PartyPopper,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [activeReview, setActiveReview] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<(typeof EVENT_CATEGORY_OPTIONS)[number] | null>(null);

  const categoryIconMap = {
    wedding: Heart,
    birthday: Cake,
    housewarming: House,
    party: PartyPopper,
    'money-forest-festival': Gift,
  } as const;

  const testimonials = useMemo(
    () => [
      {
        name: 'ស្រីម៉ុម',
        role: 'Bride',
        comment:
          'ងាយស្រួលប្រើណាស់! ខ្ញុំបង្កើតធៀបបានលឿន ហើយភ្ញៀវអាចឆែក RSVP បានស្រួល។',
        rating: 5,
      },
      {
        name: 'ចាន់វណ្ណៈ',
        role: 'Event Host',
        comment:
          'Design ទំនើប និងស្អាត។ QR និង Guest tracking ជួយកាត់បន្ថយការងារច្រើន។',
        rating: 5,
      },
      {
        name: 'លក្ខិណា',
        role: 'Customer',
        comment:
          'Mobile និង Desktop ឃើញស្អាតដូចគ្នា។ ខ្ញុំចូលចិត្ត Khmer UI ខ្លាំងណាស់។',
        rating: 4,
      },
    ],
    [],
  );

  const faqs = [
    {
      question: 'តើអាចបង្កើតព្រឹត្តិការណ៍បានប្រភេទអ្វីខ្លះ?',
      answer: 'អ្នកអាចបង្កើត Wedding, Birthday, ជប់លៀង និងបុណ្យផ្កាប្រាក់។',
    },
    {
      question: 'ភ្ញៀវអាចឆ្លើយ RSVP តាមទូរស័ព្ទបានទេ?',
      answer: 'បាន។ លីងអញ្ជើញ public អាចបើកលើទូរស័ព្ទ ហើយភ្ញៀវឆ្លើយ RSVP បានភ្លាម។',
    },
    {
      question: 'តើត្រូវបង់លុយសម្រាប់ MVP ដែរឬទេ?',
      answer: 'មិនទេ។ ក្នុងដំណាក់កាល MVP គំរូជាច្រើនអាចប្រើបានដោយឥតគិតថ្លៃ។',
    },
  ];

  const review = testimonials[activeReview];
  return (
    <div className="min-h-screen bg-white font-khmer-body text-slate-800">
      <header className="sticky top-0 z-50 border-b border-slate-100/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="#home" className="font-khmer-heading text-xl text-slate-900">
            Pithi Digital
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <Link href="#home" className="transition-colors hover:text-amber-600">Home</Link>
            <Link href="#services" className="transition-colors hover:text-amber-600">Services</Link>
            <Link href="#faq" className="transition-colors hover:text-amber-600">FAQ</Link>
            <Link href="#contact" className="transition-colors hover:text-amber-600">Contact</Link>
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button className="bg-amber-600 hover:bg-amber-700 text-white">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" className="border-amber-200 text-amber-600 hover:bg-amber-50 hover:border-amber-400 hover:text-amber-700">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero Section ── */}
        <section id="home" className="relative overflow-hidden">
          {/* Blurred background image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('/GlfpFt.jpg')",
              filter: 'blur(10px)',
              transform: 'scale(1.12)',
            }}
            aria-hidden="true"
          />
          {/* Soft white overlay for readability */}
          <div className="absolute inset-0 bg-white/72" aria-hidden="true" />

          <div className="relative mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2">

              {/* ── Left: Text & CTA ── */}
              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-sm font-semibold text-amber-700 ring-1 ring-amber-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  ប្រព័ន្ធធៀបឌីជីថលទំនើប
                </div>

                <h1
                  className="font-khmer-heading text-4xl leading-snug text-slate-900 sm:text-5xl lg:text-6xl"
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                >
                  រៀបការបែបឌីជីថល<br />ក្នុងដៃអ្នក
                </h1>

                <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-600 sm:text-lg">
                  ផ្ញើធៀបឌីជីថលដ៏ស្រស់ស្អាត គ្រប់គ្រងភ្ញៀវ និង RSVP ងាយស្រួល
                  ជាមួយបទពិសោធន៍ទំនើប និងសុវត្ថិភាព។
                </p>

                {/* CTA buttons */}
                <div className="mt-8 flex flex-wrap gap-3">
                  {isAuthenticated ? (
                    <Link href="/dashboard">
                      <Button className="h-12 bg-amber-600 px-8 text-base font-semibold text-white shadow-lg shadow-amber-200 hover:bg-amber-700 hover:shadow-amber-300">
                        ទៅ Dashboard →
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link href="/register">
                        <Button className="h-12 bg-amber-600 px-8 text-base font-semibold text-white shadow-lg shadow-amber-200 hover:bg-amber-700">
                          ចាប់ផ្តើមឥឡូវនេះ →
                        </Button>
                      </Link>
                      <Link href="/login">
                        <Button variant="outline" className="h-12 border-slate-300 px-6 text-base hover:bg-white/80">
                          ចូលគណនី
                        </Button>
                      </Link>
                    </>
                  )}
                </div>

                {/* 3 Simple Steps Section */}
                <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
                  {/* Step 1: Choose Template */}
                  <div className="flex flex-col items-start gap-3">
                    <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-br from-amber-100 to-rose-100 text-amber-700">
                      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-khmer-body font-semibold text-slate-900">ជ្រើសរើសម៉ូដ</p>
                      <p className="mt-1 text-sm text-slate-600">ជ្រើសរើសរចនាបថធៀបដែលអ្នកពេញចិត្ត</p>
                    </div>
                  </div>

                  {/* Step 2: Fill Information */}
                  <div className="flex flex-col items-start gap-3">
                    <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-br from-amber-100 to-rose-100 text-amber-700">
                      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-khmer-body font-semibold text-slate-900">បំពេញព័ត៌មាន</p>
                      <p className="mt-1 text-sm text-slate-600">ដាក់ឈ្មោះកូនកំលោះ ក្រមុំ និងទីកន្លែងកម្មវិធី</p>
                    </div>
                  </div>

                  {/* Step 3: Send to Guests */}
                  <div className="flex flex-col items-start gap-3">
                    <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-br from-amber-100 to-rose-100 text-amber-700">
                      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2m0 0v-8m0 8l-6-4m6 4l6-4" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-khmer-body font-semibold text-slate-900">ផ្ញើទៅកាន់ភ្ញៀវ</p>
                      <p className="mt-1 text-sm text-slate-600">ចែករំលែកតាម Social Media និងគ្រប់គ្រង RSVP</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Right: Sampeah Hands + Lotus Visual ── */}
              <div className="relative flex items-center justify-center py-8">
                {/* Radial glow background for lotus */}
                <div
                  className="absolute h-[500px] w-[500px] rounded-full bg-gradient-to-br from-amber-100/80 via-amber-50/40 to-transparent blur-3xl"
                  aria-hidden="true"
                />

                {/* Inner warm light glow */}
                <div
                  className="absolute h-[300px] w-[300px] rounded-full bg-gradient-to-br from-yellow-200/50 to-transparent blur-2xl"
                  aria-hidden="true"
                />

                {/* Main visual container */}
                <div className="relative h-[480px] w-[400px] flex items-center justify-center">

                  {/* Lotus Illustration (vector) - Center */}
                  <svg
                    className="absolute z-20 h-[180px] w-[180px] drop-shadow-xl"
                    viewBox="0 0 200 200"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-label="Decorative lotus flower"
                  >
                    {/* Gold foil gradient */}
                    <defs>
                      <radialGradient id="lotusGradient" cx="35%" cy="35%">
                        <stop offset="0%" stopColor="#FFF8DC" />
                        <stop offset="25%" stopColor="#FFD700" />
                        <stop offset="60%" stopColor="#DAA520" />
                        <stop offset="100%" stopColor="#B8860B" />
                      </radialGradient>
                      <filter id="lotusGlow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    {/* Outer petals (8) */}
                    <g filter="url(#lotusGlow)">
                      <ellipse cx="155" cy="100" rx="28" ry="45" fill="url(#lotusGradient)" opacity="0.9" transform="rotate(0 100 100)" />
                      <ellipse cx="138.8" cy="138.8" rx="28" ry="45" fill="url(#lotusGradient)" opacity="0.9" transform="rotate(45 100 100)" />
                      <ellipse cx="100" cy="155" rx="28" ry="45" fill="url(#lotusGradient)" opacity="0.9" transform="rotate(90 100 100)" />
                      <ellipse cx="61.2" cy="138.8" rx="28" ry="45" fill="url(#lotusGradient)" opacity="0.9" transform="rotate(135 100 100)" />
                      <ellipse cx="45" cy="100" rx="28" ry="45" fill="url(#lotusGradient)" opacity="0.9" transform="rotate(180 100 100)" />
                      <ellipse cx="61.2" cy="61.2" rx="28" ry="45" fill="url(#lotusGradient)" opacity="0.9" transform="rotate(225 100 100)" />
                      <ellipse cx="100" cy="45" rx="28" ry="45" fill="url(#lotusGradient)" opacity="0.9" transform="rotate(270 100 100)" />
                      <ellipse cx="138.8" cy="61.2" rx="28" ry="45" fill="url(#lotusGradient)" opacity="0.9" transform="rotate(315 100 100)" />
                    </g>

                    {/* Inner petals (8) - slightly smaller */}
                    <g filter="url(#lotusGlow)">
                      <ellipse cx="138" cy="100" rx="20" ry="32" fill="url(#lotusGradient)" opacity="0.95" transform="rotate(22.5 100 100)" />
                      <ellipse cx="127" cy="127" rx="20" ry="32" fill="url(#lotusGradient)" opacity="0.95" transform="rotate(67.5 100 100)" />
                      <ellipse cx="100" cy="138" rx="20" ry="32" fill="url(#lotusGradient)" opacity="0.95" transform="rotate(112.5 100 100)" />
                      <ellipse cx="73" cy="127" rx="20" ry="32" fill="url(#lotusGradient)" opacity="0.95" transform="rotate(157.5 100 100)" />
                      <ellipse cx="62" cy="100" rx="20" ry="32" fill="url(#lotusGradient)" opacity="0.95" transform="rotate(202.5 100 100)" />
                      <ellipse cx="73" cy="73" rx="20" ry="32" fill="url(#lotusGradient)" opacity="0.95" transform="rotate(247.5 100 100)" />
                      <ellipse cx="100" cy="62" rx="20" ry="32" fill="url(#lotusGradient)" opacity="0.95" transform="rotate(292.5 100 100)" />
                      <ellipse cx="127" cy="73" rx="20" ry="32" fill="url(#lotusGradient)" opacity="0.95" transform="rotate(337.5 100 100)" />
                    </g>

                    {/* Center stamen */}
                    <circle cx="100" cy="100" r="18" fill="url(#lotusGradient)" filter="url(#lotusGlow)" />
                    <circle cx="98" cy="98" r="10" fill="#FFFACD" opacity="0.8" />
                  </svg>

                  {/* Hands photo placeholder - Bottom Right */}
                  <div className="absolute bottom-0 right-0 z-10">
                    <div className="relative">
                      {/* Subtle shadow under hands */}
                      <div
                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-64 h-16 bg-black/5 blur-2xl rounded-full"
                        aria-hidden="true"
                      />

                      {/* Image container with gentle frame */}
                      <div className="relative border-4 border-white bg-white p-1 drop-shadow-lg rounded-2xl">
                        {/* Placeholder for hands photo - in production, replace with actual image */}
                        <div className="w-64 h-72 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl overflow-hidden flex items-center justify-center">
                          {/* SVG placeholder for two hands in Sampeah position */}
                          <svg
                            className="w-48 h-48"
                            viewBox="0 0 200 240"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-label="Hands performing traditional Khmer Sampeah greeting"
                          >
                            <defs>
                              <linearGradient id="skinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#E8C4A8" />
                                <stop offset="100%" stopColor="#D4A882" />
                              </linearGradient>
                              <filter id="handShadow">
                                <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.15" />
                              </filter>
                            </defs>

                            {/* Left hand */}
                            <path
                              d="M 80 80 Q 70 100 75 140 L 78 160 M 75 120 L 65 130 M 75 120 L 70 135 M 78 110 L 72 125"
                              stroke="#D4A882"
                              strokeWidth="8"
                              fill="none"
                              strokeLinecap="round"
                              filter="url(#handShadow)"
                            />
                            <ellipse cx="75" cy="70" rx="12" ry="18" fill="url(#skinGradient)" filter="url(#handShadow)" />

                            {/* Right hand */}
                            <path
                              d="M 120 80 Q 130 100 125 140 L 122 160 M 125 120 L 135 130 M 125 120 L 130 135 M 122 110 L 128 125"
                              stroke="#D4A882"
                              strokeWidth="8"
                              fill="none"
                              strokeLinecap="round"
                              filter="url(#handShadow)"
                            />
                            <ellipse cx="125" cy="70" rx="12" ry="18" fill="url(#skinGradient)" filter="url(#handShadow)" />

                            {/* Prayer position indicator */}
                            <path
                              d="M 100 60 L 100 160"
                              stroke="#DAA520"
                              strokeWidth="1.5"
                              strokeDasharray="3,3"
                              opacity="0.3"
                            />
                          </svg>
                        </div>
                      </div>

                      {/* Decorative accent - small touch of pink */}
                      <div className="absolute -top-3 -right-3 w-8 h-8 bg-rose-300/60 rounded-full blur-lg" aria-hidden="true" />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        <section id="services" className="mx-auto w-full max-w-7xl px-4 pt-16 pb-20 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="font-khmer-heading text-2xl text-slate-900 sm:text-3xl">បញ្ជីព្រឹត្តិការណ៍</h2>
            <p className="mt-2 text-slate-500">ជ្រើសប្រភេទព្រឹត្តិការណ៍ដែលអ្នកចង់រៀបចំ</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {EVENT_CATEGORY_OPTIONS.map((item) => {
              const Icon = categoryIconMap[item.key as keyof typeof categoryIconMap] || Sparkles;

              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setSelectedCategory(item)}
                  className="group rounded-2xl border border-rose-100 bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:border-rose-300 hover:shadow-rose-100 hover:shadow-md"
                >
                  <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-rose-100 text-rose-600 transition-colors group-hover:bg-rose-600 group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="font-khmer-body text-sm font-semibold text-slate-900">{item.subtitle}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.title}</p>
                </button>
              );
            })}
          </div>
        </section>

        <Dialog open={Boolean(selectedCategory)} onOpenChange={(open) => !open && setSelectedCategory(null)}>
          <DialogContent className="max-w-md rounded-3xl bg-white p-6">
            <DialogTitle className="font-khmer-heading text-xl text-slate-900">{selectedCategory?.subtitle}</DialogTitle>
            <p className="mt-1 text-sm text-slate-500">{selectedCategory?.title}</p>

            <div className="mt-4 space-y-3 rounded-2xl border border-rose-100 bg-rose-50/50 p-4 text-sm text-slate-700">
              <p><span className="font-semibold">ម្ចាស់កម្មវិធី:</span> ឈ្មោះម្ចាស់កម្មវិធី</p>
              <p><span className="font-semibold">កាលបរិច្ឆេទ:</span> ០១ មករា ២០២៧</p>
              <p><span className="font-semibold">ទីតាំង:</span> ភ្នំពេញ, កម្ពុជា</p>
              <p><span className="font-semibold">កម្មវិធីសង្ខេប:</span> {selectedCategory?.description}</p>
            </div>

            <Button type="button" onClick={() => setSelectedCategory(null)} className="mt-4 w-full rounded-full bg-rose-600 font-semibold text-white hover:bg-rose-700">
              បិទ
            </Button>
          </DialogContent>
        </Dialog>

        <section className="bg-rose-50/40 py-20">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">

            {/* Section heading */}
            <div className="mb-8 text-center">
              <h2 className="font-khmer-heading text-2xl text-slate-900 sm:text-3xl">
                ស្វែងយល់ពីមុខងារពិសេសៗរបស់យើង
              </h2>
              <p className="mt-2 text-slate-500">ឧបករណ៍ទំនើបដើម្បីធ្វើឱ្យព្រឹត្តិការណ៍របស់អ្នកលេចធ្លោ</p>
            </div>

            {/* Big banner */}
            <div className="relative overflow-hidden rounded-3xl" style={{ border: '3px dashed rgba(255,255,255,0.7)' }}>
              {/* Two-tone background */}
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-rose-400" />
                <div
                  className="absolute bottom-0 left-0 right-0"
                  style={{
                    height: '50%',
                    background: 'linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)',
                    clipPath: 'polygon(0 40%, 100% 0%, 100% 100%, 0% 100%)',
                  }}
                />
              </div>

              {/* Dashed inner border */}
              <div
                className="absolute inset-3 rounded-2xl pointer-events-none"
                style={{ border: '2px dashed rgba(255,255,255,0.5)' }}
                aria-hidden="true"
              />

              {/* Content */}
              <div className="relative grid min-h-[460px] grid-cols-1 items-center gap-6 px-8 py-12 lg:grid-cols-[1fr_auto_1fr]">

                {/* Left: Phone mockup + feature list */}
                <div className="flex justify-center lg:justify-end">
                  <div className="relative -rotate-6 drop-shadow-2xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/frame.png"
                      alt="App on mobile"
                      className="h-[320px] w-auto object-contain sm:h-[380px]"
                    />
                    {/* Top callout */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-rose-600 shadow-sm">
                      បង្កើតជម្រើសពីបាន! ✦
                    </div>
                    {/* Feature list card floating beside phone */}
                    <div className="absolute -right-40 top-8 w-36 rotate-6 rounded-2xl bg-white/95 p-3 shadow-xl">
                      <p className="mb-2 text-[9px] font-bold uppercase tracking-wide text-rose-600">មុខងារ</p>
                      <ul className="space-y-1.5">
                        {[
                          'បង្កើតពិធីមង្គលការ',
                          'គ្រប់គ្រងបញ្ជីភ្ញៀវ',
                          'ផ្ញើរការអញ្ជើញ',
                          'កត់ចំណងដៃ',
                          'ផែនការចំណាយ',
                        ].map((item, i) => (
                          <li key={item} className="flex items-center gap-1.5">
                            <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${i === 0 ? 'bg-rose-500' : 'bg-slate-300'}`} />
                            <span className={`text-[9px] leading-tight ${i === 0 ? 'font-semibold text-rose-600' : 'text-slate-500'}`}>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Center: Bold text */}
                <div className="text-center text-white">
                  <p className="font-khmer-heading text-2xl leading-snug drop-shadow sm:text-3xl">
                    ដាយប្រើដើម
                  </p>
                  <div className="mt-2 rounded-lg bg-blue-700/80 px-4 py-2">
                    <p className="font-khmer-heading text-2xl text-white drop-shadow sm:text-3xl">
                      កម្មវិធីគ្រប់គ្រង
                    </p>
                  </div>
                  <p className="mt-2 font-khmer-heading text-xl drop-shadow sm:text-2xl">
                    បានឥតឈប់!
                  </p>

                  {/* Sparkles */}
                  <div className="mt-4 flex justify-center gap-3 text-yellow-200">
                    <Sparkles className="h-5 w-5" />
                    <Sparkles className="h-4 w-4 opacity-70" />
                    <Sparkles className="h-5 w-5" />
                  </div>
                </div>

                {/* Right: Mock UI card */}
                <div className="flex justify-center lg:justify-start">
                  <div className="relative rotate-3 drop-shadow-2xl">
                    {/* Fake UI card to represent web interface */}
                    <div className="w-64 rounded-2xl bg-white p-4 shadow-xl sm:w-72">
                      <div className="mb-3 flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                        <div className="h-2 w-24 rounded-full bg-slate-200" />
                      </div>
                      <div className="space-y-2">
                        {['ឈ្មោះព្រឹត្តិការណ៍', 'កាលបរិច្ឆេទ', 'ទីតាំង', 'ប្រភេទ'].map((label) => (
                          <div key={label}>
                            <p className="mb-1 text-[10px] text-slate-400">{label}</p>
                            <div className="h-7 rounded-lg border border-slate-100 bg-slate-50" />
                          </div>
                        ))}
                        <div className="flex gap-2 pt-1">
                          <div className="h-7 flex-1 rounded-lg bg-slate-100" />
                          <div className="h-7 flex-1 rounded-lg bg-rose-500" />
                        </div>
                      </div>
                    </div>
                    {/* Callout */}
                    <div className="absolute -top-6 right-2 whitespace-nowrap rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-blue-700 shadow-sm">
                      ✦ ដាយស្រួលញញួរកំម៉ាន
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="font-khmer-heading text-2xl text-slate-900 sm:text-3xl">មតិអ្នកប្រើប្រាស់</h2>
            <p className="mt-2 text-slate-500">សម្ដីពិតពីអ្នកប្រើប្រាស់របស់យើង</p>
          </div>
          <div className="rounded-3xl border border-rose-100 bg-white p-6 shadow-sm">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <article className="rounded-2xl border border-rose-50 bg-rose-50/50 p-6">
                <div className="mb-3 flex gap-1 text-rose-500">
                  {Array.from({ length: review.rating }).map((_, index) => (
                    <Sparkles key={`${review.name}-${index}`} className="h-4 w-4 fill-rose-500" />
                  ))}
                </div>
                <p className="text-slate-700">"{review.comment}"</p>
                <p className="mt-4 font-semibold text-slate-900">{review.name}</p>
                <p className="text-sm text-slate-500">{review.role}</p>
              </article>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveReview((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
                  className="rounded-full border-rose-200 text-rose-600 hover:bg-rose-50"
                  aria-label="Previous review"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveReview((prev) => (prev + 1) % testimonials.length)}
                  className="rounded-full border-rose-200 text-rose-600 hover:bg-rose-50"
                  aria-label="Next review"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="bg-rose-50/40 py-20">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
              <h2 className="font-khmer-heading text-2xl text-slate-900 sm:text-3xl">សំនួរដែលគេសួរញឹកញាប់</h2>
              <p className="mt-2 text-slate-500">ចម្លើយចំពោះសំនួរទូទៅ</p>
            </div>
            <div className="space-y-3">
              {faqs.map((faq) => (
                <details key={faq.question} className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm">
                  <summary className="cursor-pointer list-none text-base font-semibold text-slate-900 transition-colors hover:text-rose-600">
                    {faq.question}
                  </summary>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer id="contact" className="border-t border-slate-100 bg-white text-slate-700">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <h3 className="font-khmer-heading text-2xl text-slate-900">Pithi Digital</h3>
            <p className="mt-3 max-w-sm text-sm text-slate-500">
              ដំណោះស្រាយធៀបឌីជីថលទំនើប សម្រាប់ការរៀបចំព្រឹត្តិការណ៍របស់អ្នកឱ្យមានភាពងាយស្រួល និងស្រស់ស្អាត។
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <a href="#" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-600" aria-label="Facebook">
                <span className="text-sm font-bold">f</span>
              </a>
              <a href="#" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-600" aria-label="Telegram">
                <Send className="h-4 w-4" />
              </a>
              <a href="#" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-600" aria-label="TikTok">
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 py-5 text-center text-xs text-slate-400">
          © 2026 Pithi Digital. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
