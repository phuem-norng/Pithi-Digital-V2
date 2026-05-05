'use client';

import Link from 'next/link';
import { Assets } from '@/lib/assets';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import { Marquee } from '@/registry/magicui/marquee';
import { cn } from '@/lib/utils';
import { ConfettiSideCannons } from '@/components/confetti-side-cannons';
import { EVENT_CATEGORY_OPTIONS } from '@/lib/event-categories';
import { useLanguage } from '@/lib/language-context';
import { motion } from 'framer-motion';
import {
  Cake,
  Gift,
  House,
  Heart,
  PartyPopper,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';

/** Demo video for multi-device showcases (replace with your R2 asset when ready). */
const SHOWCASE_DEMO_VIDEO =
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
const SHOWCASE_COMPUTER_IMAGE =
  'https://pub-93085525881746c1a7b523e463cbfb35.r2.dev/public/showcase/computer-screen.png';
const SHOWCASE_IPHONE_IMAGE =
  'https://pub-93085525881746c1a7b523e463cbfb35.r2.dev/public/showcase/iphone-screen.png';
const SHOWCASE_IPHONE_SIDE_WEDDING_IMAGE =
  'https://pub-93085525881746c1a7b523e463cbfb35.r2.dev/public/showcase/iphone-side-wedding.png';
const SHOWCASE_IPHONE_RIGHT_WEDDING_IMAGE =
  'https://pub-93085525881746c1a7b523e463cbfb35.r2.dev/public/showcase/iphone-right-wedding.png';
const SHOWCASE_IPHONE_LEFT_WEDDING_IMAGE =
  'https://pub-93085525881746c1a7b523e463cbfb35.r2.dev/public/showcase/iphone-left-wedding.png';

type ReviewCardProps = {
  img: string;
  name: string;
  username: string;
  body: string;
};

function ReviewCard({ img, name, username, body }: ReviewCardProps) {
  return (
    <figure
      className={cn(
        'relative h-full w-64 cursor-pointer overflow-hidden rounded-xl border p-4',
        'border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]',
        'dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]',
      )}
    >
      <div className="flex flex-row items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="rounded-full" width="32" height="32" alt={name} src={img} />
        <div className="flex flex-col">
          <figcaption className="text-sm font-medium dark:text-white">{name}</figcaption>
          <p className="text-xs font-medium dark:text-white/40">{username}</p>
        </div>
      </div>
      <blockquote className="mt-2 text-sm">{body}</blockquote>
    </figure>
  );
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { language, setLanguage } = useLanguage();
  const isKhmer = language === 'km';
  const [activeSection, setActiveSection] = useState('home');
  const [activeShowcaseTab, setActiveShowcaseTab] = useState('event-wedding');
  const [isScrolled, setIsScrolled] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const navLinks = useMemo(
    () => [
      { label: isKhmer ? 'ទំព័រដើម' : 'Home', key: 'home' },
      { label: isKhmer ? 'សេវាកម្ម' : 'Services', key: 'services' },
      { label: 'FAQ', key: 'faq' },
      { label: isKhmer ? 'ទំនាក់ទំនង' : 'Contact', key: 'contact' },
    ],
    [isKhmer],
  );

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
        username: '@sreymom',
        role: 'Bride',
        comment:
          'ងាយស្រួលប្រើណាស់! ខ្ញុំបង្កើតធៀបបានលឿន ហើយភ្ញៀវអាចឆែក RSVP បានស្រួល។',
        rating: 5,
        img: 'https://avatar.vercel.sh/sreymom',
      },
      {
        name: 'ចាន់វណ្ណៈ',
        username: '@chanvanna',
        role: 'Event Host',
        comment:
          'Design ទំនើប និងស្អាត។ QR និង Guest tracking ជួយកាត់បន្ថយការងារច្រើន។',
        rating: 5,
        img: 'https://avatar.vercel.sh/chanvanna',
      },
      {
        name: 'លក្ខិណា',
        username: '@leakna',
        role: 'Customer',
        comment:
          'Mobile និង Desktop ឃើញស្អាតដូចគ្នា។ ខ្ញុំចូលចិត្ត Khmer UI ខ្លាំងណាស់។',
        rating: 4,
        img: 'https://avatar.vercel.sh/leakna',
      },
      {
        name: 'សុភា',
        username: '@sophea',
        role: 'Organizer',
        comment:
          'ខ្ញុំចូលចិត្តការរចនាបែបទំនើប និងការចែករំលែកតាម Telegram ងាយណាស់។',
        rating: 5,
        img: 'https://avatar.vercel.sh/sophea',
      },
      {
        name: 'ដារ៉ា',
        username: '@dara',
        role: 'Couple',
        comment:
          'Guest list និង RSVP មើលស្រួល ធ្វើឱ្យការរៀបចំពិធីរលូនជាងមុន។',
        rating: 5,
        img: 'https://avatar.vercel.sh/dara',
      },
      {
        name: 'វិរៈ',
        username: '@veara',
        role: 'Customer',
        comment:
          'Template ស្អាត ហើយល្បឿនបើកលើទូរស័ព្ទលឿន។ យើងពេញចិត្តខ្លាំង។',
        rating: 4,
        img: 'https://avatar.vercel.sh/veara',
      },
    ],
    [],
  );

  const faqs = [
    {
      question: isKhmer ? 'តើអាចបង្កើតព្រឹត្តិការណ៍បានប្រភេទអ្វីខ្លះ?' : 'What event types can I create?',
      answer:
        isKhmer
          ? 'អ្នកអាចបង្កើត Wedding, Birthday, Party (ជប់លៀង), Housewarming (ឡើងផ្ទះ) និងបុណ្យផ្កាប្រាក់ បានតាមតម្រូវការ។'
          : 'You can create Wedding, Birthday, Party, Housewarming, and Money Forest Festival invitations.',
    },
    {
      question: isKhmer ? 'ភ្ញៀវអាចឆ្លើយ RSVP តាមទូរស័ព្ទបានទេ?' : 'Can guests RSVP on mobile?',
      answer:
        isKhmer
          ? 'បាន។ ភ្ញៀវអាចបើកលីងឬស្កេន QR Code លើទូរស័ព្ទ ហើយឆ្លើយ RSVP បានភ្លាមៗ ដោយមិនចាំបាច់តំឡើង App ផ្សេងទៀត។'
          : 'Yes. Guests can open the invite link or scan a QR Code on mobile and respond instantly without installing another app.',
    },
    {
      question: isKhmer ? 'តើត្រូវបង់លុយសម្រាប់ MVP ដែរឬទេ?' : 'Do I need to pay during MVP?',
      answer: isKhmer
        ? 'មិនទេ។ ក្នុងដំណាក់កាល MVP អ្នកអាចសាកល្បង template និងមុខងារចម្បងបានដោយឥតគិតថ្លៃ។'
        : 'No. During the MVP phase, you can use core templates and features for free.',
    },
    {
      question: isKhmer ? 'តើអាចកែព័ត៌មានបន្ទាប់ពីបង្កើតរួចបានទេ?' : 'Can I edit details after creation?',
      answer:
        isKhmer
          ? 'បាន។ អ្នកអាចកែឈ្មោះ មាតិកា កាលបរិច្ឆេទ ទីតាំង និងផ្នែកសំខាន់ៗផ្សេងទៀតបានគ្រប់ពេល មុននិងក្រោយការចែករំលែក។'
          : 'Yes. You can edit names, content, date, location, and other important details anytime before or after sharing.',
    },
    {
      question: isKhmer ? 'តើអាចចែករំលែកការអញ្ជើញតាមណាខ្លះ?' : 'How can I share invitations?',
      answer:
        isKhmer
          ? 'អ្នកអាចចែករំលែកតាម Link ឬ QR Code ទៅ Telegram, Facebook, Messenger និងបណ្តាញសង្គមផ្សេងៗបានយ៉ាងងាយស្រួល។'
          : 'You can share via Link or QR Code to Telegram, Facebook, Messenger, and other social platforms.',
    },
    {
      question: isKhmer ? 'តើប្រព័ន្ធមានជំនួយគ្រប់គ្រងភ្ញៀវ និងចំណាយទេ?' : 'Does the system help manage guests and costs?',
      answer:
        isKhmer
          ? 'មាន។ អ្នកអាចតាមដានភ្ញៀវដែលបានឆ្លើយ RSVP និងប្រើផ្នែកគ្រប់គ្រងកម្មវិធី ដើម្បីមើលភាពចំណេញ ឬខាតក្នុងកម្មវិធី។'
          : 'Yes. You can track RSVP responses and use the event management tools to monitor profit or loss.',
    },
    {
      question: isKhmer ? 'តើទិន្នន័យរបស់ខ្ញុំមានសុវត្ថិភាពទេ?' : 'Is my data secure?',
      answer:
        isKhmer
          ? 'មានសុវត្ថិភាព។ យើងផ្តោតលើការរក្សាទុកទិន្នន័យ និងសិទ្ធិចូលប្រើប្រាស់ឲ្យបានត្រឹមត្រូវ ដើម្បីការពារព័ត៌មានកម្មវិធីរបស់អ្នក។'
          : 'Yes. We focus on secure data storage and proper access control to protect your event information.',
    },
  ];

  const firstRow = testimonials.slice(0, Math.ceil(testimonials.length / 2));
  const secondRow = testimonials.slice(Math.ceil(testimonials.length / 2));
  const eventShowcaseItems = useMemo(
    () => [
      {
        id: 'event-wedding',
        title: isKhmer ? 'អាពាហ៍ពិពាហ៍' : 'Wedding',
        subtitle: 'Wedding',
        description:
          isKhmer
            ? 'បង្កើតធៀបមង្គលការទំនើប មានកាលវិភាគ និង RSVP ស្អាតៗ សម្រាប់រៀបចំពិធីឲ្យមានរបៀប និងអារម្មណ៍ថ្លៃថ្នូរ។'
            : 'Create elegant wedding invitations with timeline and RSVP to run your ceremony smoothly and beautifully.',
        ctaLabel: isKhmer ? 'មើល Wedding Template' : 'View Wedding Template',
        href: '/register',
        mediaType: 'video' as const,
        mediaSrc: SHOWCASE_DEMO_VIDEO,
        phoneType: 'iphone15pro' as const,
      },
      {
        id: 'event-birthday',
        title: isKhmer ? 'ខួបកំណើត' : 'Birthday',
        subtitle: 'Birthday',
        description:
          isKhmer
            ? 'Design ផ្អែមល្ហែម សម្រាប់ជួបជុំគ្រួសារ និងមិត្តភក្តិ ជាមួយលីងអញ្ជើញងាយចែករំលែក និងគ្រប់គ្រងភ្ញៀវបានរលូន។'
            : 'A warm birthday style for family and friends with easy sharing and smooth guest management.',
        ctaLabel: isKhmer ? 'មើល Birthday Template' : 'View Birthday Template',
        href: '/register',
        mediaType: 'video' as const,
        mediaSrc: SHOWCASE_DEMO_VIDEO,
        phoneType: 'iphone16pro' as const,
      },
      {
        id: 'event-party',
        title: isKhmer ? 'ជប់លៀង' : 'Party',
        subtitle: 'Party',
        description:
          isKhmer
            ? 'Highlight បរិយាកាសសប្បាយៗ របស់កម្មវិធីជប់លៀង ដោយបង្ហាញព័ត៌មានសំខាន់ៗ និងចំណុចពិសេសៗលើ invite តែមួយ។'
            : 'Highlight your party vibe with key details and special moments in one modern invitation.',
        ctaLabel: isKhmer ? 'មើល Party Template' : 'View Party Template',
        href: '/register',
        mediaType: 'video' as const,
        mediaSrc: SHOWCASE_DEMO_VIDEO,
        phoneType: 'iphone15pro' as const,
      },
      {
        id: 'event-money-forest-festival',
        title: isKhmer ? 'បុណ្យផ្កាប្រាក់' : 'Money Forest Festival',
        subtitle: 'Money Forest Festival',
        description:
          isKhmer
            ? 'រចនាបថបែបបុណ្យប្រពៃណី ដោយរក្សាភាពឆើតឆាយ និងទំនើបការអានងាយស្រួល សាកសមសម្រាប់ចែករំលែកទៅកាន់បរិស័ទគ្រប់វ័យនិងគ្រប់ទិសទី។'
            : 'Traditional festival styling with elegant modern readability, ideal for sharing with all devotees across locations.',
        ctaLabel: isKhmer ? 'មើល Festival Template' : 'View Festival Template',
        href: '/register',
        mediaType: 'video' as const,
        mediaSrc: SHOWCASE_DEMO_VIDEO,
        phoneType: 'iphone16pro' as const,
      },
      {
        id: 'event-housewarming',
        title: isKhmer ? 'ឡើងផ្ទះ' : 'Housewarming',
        subtitle: 'Housewarming',
        description:
          isKhmer
            ? 'សម្រាប់ពិធីឡើងគេហដ្ឋានថ្មី ជាមួយ UI ងាយស្រួលមើល លម្អិតទីតាំង និងកាលបរិច្ឆេទច្បាស់ ដើម្បីអញ្ជើញភ្ញៀវបានឆាប់រហ័ស។'
            : 'For new-home celebrations with clean UI, clear venue/date details, and fast guest invitations.',
        ctaLabel: isKhmer ? 'មើល Housewarming Template' : 'View Housewarming Template',
        href: '/register',
        mediaType: 'video' as const,
        mediaSrc: SHOWCASE_DEMO_VIDEO,
        phoneType: 'iphone15pro' as const,
      },
    ],
    [isKhmer],
  );

  useEffect(() => {
    const updateScrolled = () => {
      setIsScrolled(window.scrollY > 8);
      setShowBackToTop(window.scrollY > 300);
    };

    const sectionIds = navLinks.map((link) => link.key);
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-45% 0px -45% 0px',
        threshold: 0.05,
      },
    );

    sections.forEach((section) => observer.observe(section));
    updateScrolled();
    window.addEventListener('scroll', updateScrolled, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', updateScrolled);
    };
  }, [navLinks]);

  useEffect(() => {
    const sections = eventShowcaseItems
      .map((item) => document.getElementById(item.id))
      .filter((section): section is HTMLElement => Boolean(section));

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveShowcaseTab(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-42% 0px -45% 0px',
        threshold: 0.08,
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [eventShowcaseItems]);

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (!section) return;
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(sectionId);
    // Keep clean URL without #hash after in-page navigation.
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  };

  const scrollToShowcaseSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (!section) return;
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveShowcaseTab(sectionId);
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  };

  const navLinkClass = (isActive: boolean) =>
    cn(
      'group relative inline-flex items-center pb-1.5 text-[15px] font-medium tracking-[0.025em] font-sans transition-all duration-300',
      isActive ? 'text-slate-900 dark:text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white',
    );

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  };

  return (
    <div className="premium-dark-bg min-h-screen bg-white font-khmer-body text-slate-800 transition-colors duration-300 dark:text-slate-100">
      <header
        className={cn(
          'fixed inset-x-0 top-3 z-50 transition-all duration-300',
          isScrolled
            ? 'drop-shadow-[0_14px_26px_rgba(15,23,42,0.16)] dark:drop-shadow-[0_14px_26px_rgba(0,0,0,0.42)]'
            : 'shadow-none',
        )}
      >
        <div className="mx-auto flex w-[calc(100%-1rem)] max-w-7xl items-center justify-between rounded-full border border-white/55 bg-white/72 px-4 py-2.5 backdrop-blur-xl sm:w-[calc(100%-2rem)] sm:px-6 lg:px-8 dark:border-white/10 dark:bg-black/62">
          <button type="button" onClick={() => scrollToSection('home')} className="font-khmer-heading text-xl text-slate-900">
            <span className="inline-flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={Assets.logo}
                alt="Pithi Digital logo"
                className="h-14 w-auto rounded-sm object-contain sm:h-28"
              />
            </span>
          </button>

          <nav className="hidden items-center space-x-8 md:flex">
            {navLinks.map((item) => {
              const isActive = activeSection === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => scrollToSection(item.key)}
                  className={navLinkClass(isActive)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.label}
                  <span
                    className={cn(
                      'pointer-events-none absolute bottom-0 left-1/2 h-[1.5px] w-full -translate-x-1/2 rounded-full bg-amber-500 transition-all duration-300',
                      isActive ? 'scale-x-100 opacity-80' : 'scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100',
                    )}
                  />
                </button>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <AnimatedThemeToggler
              variant="circle"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-amber-200 bg-white/80 text-amber-700 transition-all duration-300 hover:bg-amber-50 sm:h-10 sm:w-10"
            />
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsLanguageMenuOpen((prev) => !prev)}
                className="inline-flex h-8 items-center gap-1 rounded-full border border-amber-200 bg-white/80 px-2.5 text-[11px] font-semibold text-amber-700 transition-all duration-300 hover:bg-amber-50 sm:h-10 sm:px-3 sm:text-xs"
                aria-expanded={isLanguageMenuOpen}
                aria-label="Language selector"
              >
                {isKhmer ? 'ខ្មែរ' : 'EN'}
                <span className="text-[10px]">▾</span>
              </button>
              {isLanguageMenuOpen && (
                <div className="absolute right-0 top-[calc(100%+0.4rem)] z-50 min-w-[88px] rounded-xl border border-amber-200 bg-white/95 p-1 shadow-lg backdrop-blur-md dark:border-amber-700/40 dark:bg-[#0B0E14]/95">
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage('km');
                      setIsLanguageMenuOpen(false);
                    }}
                    className={cn(
                      'block w-full rounded-md px-2.5 py-1.5 text-left text-xs font-semibold transition-all',
                      isKhmer ? 'bg-amber-500 text-white' : 'text-slate-700 hover:bg-amber-50',
                    )}
                  >
                    ខ្មែរ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage('en');
                      setIsLanguageMenuOpen(false);
                    }}
                    className={cn(
                      'block w-full rounded-md px-2.5 py-1.5 text-left text-xs font-semibold transition-all',
                      !isKhmer ? 'bg-amber-500 text-white' : 'text-slate-700 hover:bg-amber-50',
                    )}
                  >
                    EN
                  </button>
                </div>
              )}
            </div>
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button className="bg-amber-600 text-white hover:bg-amber-700 dark:bg-[#D4AF37] dark:text-[#2b200a] dark:hover:bg-[#e5c458] dark:shadow-[0_0_24px_rgba(212,175,55,0.42)]">
                  {isKhmer ? 'ផ្ទាំងគ្រប់គ្រង' : 'Dashboard'}
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login" className="inline-flex">
                  <Button variant="outline" className="h-8 rounded-full border-amber-300 px-2.5 text-[11px] text-amber-700 hover:bg-amber-50 sm:h-9 sm:px-4 sm:text-sm">
                    {isKhmer ? 'ចូលគណនី' : 'Sign In'}
                  </Button>
                </Link>
                <Link href="/register" className="inline-flex">
                  <Button className="h-8 rounded-full bg-amber-600 px-2.5 text-[11px] text-white shadow-sm hover:bg-amber-700 sm:h-9 sm:px-4 sm:text-sm">
                    {isKhmer ? 'ចាប់ផ្តើម' : 'Get Started'}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="pt-20 sm:pt-24">
        {/* ── Hero Section ── */}
        <section id="home" className="relative overflow-hidden">
          {/* Blurred background image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('${Assets.heroBackground}')`,
              filter: 'blur(10px)',
              transform: 'scale(1.12)',
            }}
            aria-hidden="true"
          />
          {/* Balinese-style pattern: under frosted white so it reads (not mix-blend on near-white) */}
          <div
            className="pointer-events-none absolute inset-0 opacity-25 sm:opacity-[0.22] dark:opacity-[0.05]"
            style={{
              backgroundImage: `url('${Assets.balinesePattern}')`,
              backgroundSize: 'clamp(300px, 46vw, 440px) auto',
              backgroundRepeat: 'repeat',
              backgroundPosition: 'center',
            }}
            aria-hidden="true"
          />
          {/* Soft white overlay — stronger frost so pattern stays very light */}
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] sm:bg-white/68 dark:bg-[#0B0E14]/64" aria-hidden="true" />
          {/* Blend hero under fixed header for seamless transition */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/80 to-transparent dark:from-black/80" aria-hidden="true" />
          {/* Abstract luxury accents */}
          <div
            className="pointer-events-none absolute -left-28 top-16 h-72 w-72 rounded-full bg-gradient-to-br from-amber-200/45 via-yellow-100/25 to-transparent blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -right-24 top-28 h-80 w-80 rounded-full bg-gradient-to-br from-amber-300/25 via-orange-200/20 to-transparent blur-3xl"
            aria-hidden="true"
          />

          <div className="relative mx-auto w-full max-w-7xl px-4 pb-6 pt-14 sm:px-6 lg:px-8 lg:pb-10 lg:pt-[5.5rem]">
            <div className="rounded-[2rem] border border-white/60 bg-white/55 p-5 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.45)] backdrop-blur-[7px] max-[380px]:p-4 sm:p-7 lg:p-8 dark:border-white/20 dark:bg-[#111723]/42">
              <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2">

                {/* ── Left: Text & CTA ── */}
                <div>
                  <div className="mb-5 mt-3 inline-flex items-center gap-2 rounded-full bg-amber-100/90 px-4 py-1.5 text-sm font-semibold text-amber-700 ring-1 ring-amber-200">
                    <Sparkles className="h-3.5 w-3.5" />
                    {isKhmer ? 'ប្រព័ន្ធធៀបឌីជីថលទំនើប' : 'Modern Digital Invitation Platform'}
                  </div>

                  <h1
                    className="font-khmer-heading bg-gradient-to-b from-slate-900 via-slate-900 to-amber-700/80 bg-clip-text text-4xl leading-[1.16] tracking-tight text-transparent max-[380px]:text-[1.85rem] max-[380px]:leading-[1.12] dark:from-white dark:via-white dark:to-amber-200/90 sm:text-5xl lg:text-6xl"
                    style={{
                      fontFamily: '"Khmer Pen-Surin", "Kantumruy Pro", var(--font-kantumruy-pro), sans-serif',
                      textShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    }}
                  >
                    {isKhmer ? 'រៀបការបែប' : 'Celebrate in'}
                    <span className="bg-gradient-to-r from-[#D4AF37] via-[#F9E29B] to-[#D4AF37] bg-clip-text text-transparent">
                      {isKhmer ? 'ឌីជីថល' : 'Digital'}
                    </span>
                    <br />
                    {isKhmer ? 'ក្នុងដៃអ្នក' : 'Your Hands'}
                  </h1>

                  <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-600 max-[380px]:text-[15px] dark:text-slate-200 sm:text-lg">
                    {isKhmer
                      ? 'ផ្ញើធៀបឌីជីថលដ៏ស្រស់ស្អាត គ្រប់គ្រងភ្ញៀវ និង RSVP ងាយស្រួល ជាមួយបទពិសោធន៍ទំនើប និងសុវត្ថិភាព។'
                      : 'Send beautiful digital invitations, manage guests and RSVP easily with a modern and secure experience.'}
                  </p>

                  {/* CTA buttons */}
                  <div className="mt-8 flex flex-col gap-4 max-[380px]:mt-6 max-[380px]:gap-3 sm:flex-row sm:flex-wrap">
                    {isAuthenticated ? (
                      <Link href="/dashboard">
                        <Button className="group h-12 bg-amber-600 px-8 text-base font-semibold text-white shadow-lg shadow-amber-200 transition-all duration-300 hover:bg-amber-700 hover:shadow-amber-300 dark:bg-[#D4AF37] dark:text-[#2b200a] dark:hover:bg-[#e5c458] dark:shadow-[0_0_28px_rgba(212,175,55,0.4)]">
                          <span className="inline-flex items-center gap-1">
                            {isKhmer ? 'ទៅ Dashboard' : 'Go to Dashboard'}
                            <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
                          </span>
                        </Button>
                      </Link>
                    ) : (
                      <>
                        <Link href="/register" className="w-full sm:w-auto">
                          <Button className="h-12 w-full bg-amber-600 px-8 text-base font-semibold text-white shadow-lg shadow-amber-200 hover:bg-amber-700 max-[380px]:h-11 max-[380px]:px-6 max-[380px]:text-[15px] sm:w-auto">
                            {isKhmer ? 'ចាប់ផ្តើមឥឡូវនេះ →' : 'Get Started →'}
                          </Button>
                        </Link>
                        <Link href="/login" className="w-full sm:w-auto">
                          <Button variant="outline" className="h-12 w-full border border-amber-500/50 bg-transparent px-6 text-base text-amber-700 hover:bg-amber-50/40 max-[380px]:h-11 max-[380px]:text-[15px] sm:w-auto">
                            {isKhmer ? 'ចូលគណនី' : 'Sign In'}
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                  <div className="mt-4">
                    <ConfettiSideCannons />
                  </div>

                  {/* 4 Simple Steps Section */}
                  <div className="relative mt-12 grid grid-cols-1 gap-8 md:grid-cols-4 md:gap-8">
                    {/* Desktop connectors (horizontal dashed flow + arrowheads) */}
                    <div className="pointer-events-none absolute left-0 right-0 top-7 z-0 hidden md:block" aria-hidden="true">
                      <div className="process-flow-line absolute left-[13%] w-[21%]">
                        <span className="process-flow-arrow" />
                      </div>
                      <div className="process-flow-line absolute left-[39%] w-[21%]">
                        <span className="process-flow-arrow" />
                      </div>
                      <div className="process-flow-line absolute left-[65%] w-[21%]">
                        <span className="process-flow-arrow" />
                      </div>
                    </div>

                    {/* Step 1: Fill Information */}
                    <div className="relative z-10 flex flex-col items-center gap-3 px-2 pb-16 text-center md:pb-0">
                      <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 via-yellow-100 to-rose-200 text-amber-700 shadow-[0_10px_24px_-12px_rgba(217,119,6,0.7)] ring-1 ring-amber-200/60">
                        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                      <div className="process-flow-vertical md:hidden" aria-hidden="true">
                        <span className="process-flow-arrow-vertical" />
                      </div>
                      <div className="relative z-10 max-w-xs">
                        <p className="font-khmer-body text-[15px] font-medium text-slate-900 dark:text-white">{isKhmer ? 'បំពេញព័ត៌មាន' : 'Fill Information'}</p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-200">
                          {isKhmer
                            ? 'ជ្រើសរើសកម្មវិធី ឈ្មោះម្ចាស់កន្លែងកម្មវិធី ទីកន្លែងកម្មវិធីជាដើម។'
                            : 'Choose event type, host details, and venue information.'}
                        </p>
                      </div>
                    </div>

                    {/* Step 2: Choose Template */}
                    <div className="relative z-10 flex flex-col items-center gap-3 px-2 pb-16 text-center md:pb-0">
                      <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 via-orange-100 to-rose-200 text-amber-700 shadow-[0_10px_24px_-12px_rgba(217,119,6,0.7)] ring-1 ring-amber-200/60">
                        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                      </div>
                      <div className="process-flow-vertical md:hidden" aria-hidden="true">
                        <span className="process-flow-arrow-vertical" />
                      </div>
                      <div className="relative z-10 max-w-xs">
                        <p className="font-khmer-body text-[15px] font-medium text-slate-900 dark:text-white">{isKhmer ? 'ជ្រើសរើសម៉ូដ' : 'Choose Template'}</p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-200">{isKhmer ? 'ជ្រើសរើសរចនាបថធៀបដែលអ្នកពេញចិត្ត' : 'Select the invitation style you love.'}</p>
                      </div>
                    </div>

                    {/* Step 3: Send to Guests */}
                    <div className="relative z-10 flex flex-col items-center gap-3 px-2 pb-16 text-center md:pb-0">
                      <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 via-yellow-100 to-orange-200 text-amber-700 shadow-[0_10px_24px_-12px_rgba(217,119,6,0.7)] ring-1 ring-amber-200/60">
                        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2m0 0v-8m0 8l-6-4m6 4l6-4" />
                        </svg>
                      </div>
                      <div className="process-flow-vertical md:hidden" aria-hidden="true">
                        <span className="process-flow-arrow-vertical" />
                      </div>
                      <div className="relative z-10 max-w-xs">
                        <p className="font-khmer-body text-[15px] font-medium text-slate-900 dark:text-white">{isKhmer ? 'ផ្ញើទៅកាន់ភ្ញៀវ' : 'Send to Guests'}</p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-200">
                          {isKhmer
                            ? 'ចែករំលែកតាម Link or QR Code to Social Media និងគ្រប់គ្រង RSVP'
                            : 'Share via Link or QR Code on social media and manage RSVP.'}
                        </p>
                      </div>
                    </div>

                    {/* Step 4: Manage Event */}
                    <div className="relative z-10 flex flex-col items-center gap-3 text-center">
                      <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 via-amber-100 to-yellow-200 text-amber-700 shadow-[0_10px_24px_-12px_rgba(217,119,6,0.7)] ring-1 ring-amber-200/60">
                        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 7h18M8 7V5a2 2 0 114 0v2m2 0V5a2 2 0 114 0v2M5 7h14a1 1 0 011 1v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8a1 1 0 011-1zm3 5h8m-8 4h5"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="font-khmer-body text-[15px] font-medium text-slate-900 dark:text-white">{isKhmer ? 'គ្រប់គ្រងកម្មវិធី' : 'Manage Event'}</p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-200">
                          {isKhmer
                            ? 'គ្រប់គ្រងកម្មវិធី ភ្ញៀវ ភាពចំណេញ ឬខាតក្នុងកម្មវិធី។'
                            : 'Track guests and monitor event profit or loss.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Right: Multi-device showcase (MacBook + iPhone) ── */}
                <motion.div
                  className="hero-float relative mx-auto flex min-h-[420px] w-full max-w-[min(100%,380px)] items-end justify-center px-2 py-10 sm:max-w-[min(100%,480px)] sm:px-4 lg:max-w-[min(100%,640px)]"
                  style={{ perspective: '1300px' }}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, ease: 'easeOut' }}
                >
                  <div
                    className="pointer-events-none absolute inset-0 -z-10 rounded-[2.6rem] bg-gradient-to-br from-amber-200/50 via-yellow-100/25 to-transparent blur-3xl"
                    aria-hidden="true"
                  />
                  {/* MacBook anchor (flat, background) */}
                  <motion.div
                    className="relative z-10 w-full transform-gpu transition-transform duration-500 hover:scale-[1.02]"
                    style={{ transformStyle: 'preserve-3d' }}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="device-screen overflow-hidden rounded-t-xl border-[8px] border-gray-800 bg-gray-900 shadow-[0_28px_60px_-20px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.06)] dark:shadow-[0_28px_62px_-20px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.08),0_0_36px_rgba(212,175,55,0.22)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={SHOWCASE_COMPUTER_IMAGE}
                        alt="Pithi Digital desktop showcase"
                        className="device-media-crop"
                      />
                    </div>
                    <div className="-ml-[5%] h-4 w-[110%] rounded-b-xl bg-gray-700 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.5)]" />
                  </motion.div>

                  {/* iPhone — tilted opposite (right / “V” leg) */}
                  <motion.div
                    className="absolute bottom-4 right-[6%] z-30 w-[min(30%,100px)] origin-[65%_100%] transform-gpu sm:right-[10%] sm:w-[min(30%,128px)] lg:right-[12%] lg:w-[148px]"
                    style={{ transformStyle: 'preserve-3d' }}
                    initial={{ opacity: 0, x: 52, y: 32, rotateX: 10, rotateY: 38, skewY: 0 }}
                    animate={{ opacity: 1, x: 0, y: 0, rotateX: 12, rotateY: -22, skewY: 3 }}
                    transition={{ duration: 0.95, delay: 0.26, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{
                      rotateX: 10,
                      rotateY: -14,
                      skewY: 2,
                      transition: { duration: 0.55, ease: 'easeOut' },
                    }}
                  >
                    <div className="device-screen relative aspect-[9/19.5] overflow-hidden rounded-[1.5rem] border-[4px] border-gray-900 bg-black shadow-[14px_36px_50px_-10px_rgba(0,0,0,0.6),8px_20px_32px_-6px_rgba(180,83,9,0.2),inset_0_1px_0_rgba(255,255,255,0.1)] transition-shadow duration-700 dark:shadow-[16px_40px_58px_-8px_rgba(0,0,0,0.72),8px_18px_36px_-4px_rgba(212,175,55,0.26),inset_0_0_0_1px_rgba(249,226,155,0.2)]">
                      <div className="pointer-events-none absolute left-1/2 top-1 z-20 h-2 w-8 -translate-x-1/2 rounded-full bg-black" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={SHOWCASE_IPHONE_IMAGE}
                        alt="Pithi Digital iPhone showcase"
                        className="device-media-iphone"
                      />
                    </div>
                  </motion.div>
                </motion.div>

              </div>
            </div>
          </div>

          {/* Scroll down mouse indicator */}
          <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 hidden -translate-x-1/2 items-center gap-2 text-slate-500/85 sm:flex">
            <span className="text-xs font-medium tracking-[0.16em]">SCROLL</span>
            <div className="scroll-mouse-indicator">
              <span className="scroll-mouse-wheel" />
            </div>
          </div>
        </section>

        <section id="services" className="mx-auto w-full max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="font-khmer-heading text-2xl text-slate-900 sm:text-3xl dark:text-slate-100">{isKhmer ? 'បញ្ជីព្រឹត្តិការណ៍' : 'Event Showcase'}</h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">{isKhmer ? 'ជ្រើសប្រភេទព្រឹត្តិការណ៍ដែលអ្នកចង់រៀបចំ' : 'Choose the event category you want to organize.'}</p>
          </div>

          <div className="relative z-10 mb-6">
            <div className="relative overflow-hidden rounded-2xl border border-amber-100/80 bg-white/90 p-2 shadow-[0_10px_24px_-20px_rgba(15,23,42,0.28)] backdrop-blur-md dark:border-amber-700/40 dark:bg-slate-900/85">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-white/95 to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white/95 to-transparent" />
              <div className="showcase-tab-loop hover:[animation-play-state:paused]">
                <div className="showcase-tab-track flex min-w-max items-center gap-1.5">
                  {[...eventShowcaseItems, ...eventShowcaseItems].map((item, index) => {
                    const isActive = activeShowcaseTab === item.id;
                    const Icon = categoryIconMap[item.id.replace('event-', '') as keyof typeof categoryIconMap] || Sparkles;

                    return (
                      <button
                        key={`${item.id}-${index}`}
                        type="button"
                        onClick={() => scrollToShowcaseSection(item.id)}
                        className={cn(
                          'group inline-flex min-w-[190px] items-center gap-2 rounded-2xl border px-4 py-2 text-left transition-all duration-300 hover:-translate-y-[2px]',
                          isActive
                            ? 'border-amber-300 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-[0_10px_22px_-14px_rgba(217,119,6,0.85)]'
                            : 'border-transparent bg-white text-slate-700 hover:border-amber-200/70 hover:bg-amber-50/70 hover:text-amber-700',
                        )}
                        aria-current={isActive ? 'true' : undefined}
                      >
                        <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-amber-50' : 'text-amber-500')} />
                        <span className="inline-flex flex-col leading-tight">
                          <span className={cn('font-khmer-body text-[15px] font-semibold', isActive ? 'text-white' : 'text-slate-800')}>
                            {item.title}
                          </span>
                          <span className={cn('text-sm font-medium', isActive ? 'text-amber-50/95' : 'text-slate-500')}>
                            {item.subtitle}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {eventShowcaseItems.map((item, index) => {
              const isReverse = index % 2 === 1;
              const isWedding = item.id === 'event-wedding';
              const leftPhoneImage = isWedding ? SHOWCASE_IPHONE_LEFT_WEDDING_IMAGE : SHOWCASE_IPHONE_IMAGE;
              const rightPhoneImage = isWedding ? SHOWCASE_IPHONE_RIGHT_WEDDING_IMAGE : SHOWCASE_IPHONE_IMAGE;

              return (
                <motion.article
                  key={item.id}
                  id={item.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.55, ease: 'easeOut' }}
                  className="scroll-mt-32 overflow-hidden rounded-3xl border border-amber-100/70 bg-gradient-to-br from-white via-amber-50/40 to-white p-6 shadow-[0_24px_44px_-36px_rgba(180,83,9,0.45)] dark:border-amber-500/20 dark:bg-gradient-to-br dark:from-[#111723] dark:via-[#0f1520] dark:to-[#0B0E14] dark:shadow-[0_28px_52px_-30px_rgba(0,0,0,0.75)] sm:p-8"
                >
                  <div className={cn('grid items-center gap-8 lg:grid-cols-2', isReverse && 'lg:[&>*:first-child]:order-2')}>
                    <motion.div
                      initial={{ opacity: 0, x: isReverse ? 48 : -48 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.35 }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="relative flex items-center justify-center px-3 py-8 sm:px-8 sm:py-12"
                    >
                      <div className="pointer-events-none absolute inset-0 -z-10 rounded-[2.6rem] bg-gradient-to-br from-amber-300/45 via-yellow-100/20 to-transparent blur-3xl" />
                      <div className="pointer-events-none absolute inset-8 -z-10 rounded-[2rem] bg-white/30 backdrop-blur-2xl" />

                      <div className="relative z-30 h-[320px] w-full max-w-[240px] sm:h-[430px] sm:w-[390px] sm:max-w-none lg:h-[520px] lg:w-[470px]">
                        <div className="absolute bottom-0 left-[0%] z-20 w-[34%] -rotate-[10deg] transition-transform duration-500 hover:-translate-y-2 sm:left-0 sm:z-10 sm:w-[36%]">
                          <div className="relative aspect-[9/19.5] overflow-hidden rounded-[1.35rem] border-[4px] border-gray-900 bg-black shadow-[0_20px_38px_-16px_rgba(0,0,0,0.6)]">
                            <div className="absolute left-1/2 top-1 z-20 h-2 w-8 -translate-x-1/2 rounded-full bg-black" />
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={leftPhoneImage} alt="Left iPhone template preview" className="device-media-iphone" />
                          </div>
                        </div>

                        <div className="absolute bottom-0 left-[50%] z-30 w-[56%] -translate-x-1/2 transition-transform duration-500 hover:-translate-y-2 sm:left-1/2 sm:w-[43%]">
                          <div className="relative aspect-[9/19.5] overflow-hidden rounded-[1.55rem] border-[4px] border-gray-900 bg-black shadow-[0_30px_52px_-18px_rgba(0,0,0,0.72),0_0_18px_rgba(212,175,55,0.24)]">
                            <div className="absolute left-1/2 top-1 z-20 h-2 w-8 -translate-x-1/2 rounded-full bg-black" />
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={SHOWCASE_IPHONE_IMAGE} alt="iPhone template preview" className="device-media-iphone" />
                          </div>
                        </div>

                        <div className="absolute bottom-0 -right-[2%] z-20 w-[34%] rotate-[10deg] transition-transform duration-500 hover:-translate-y-2 sm:right-0 sm:w-[36%]">
                          <div className="relative aspect-[9/19.5] overflow-hidden rounded-[1.35rem] border-[4px] border-gray-900 bg-black shadow-[0_20px_38px_-16px_rgba(0,0,0,0.6)]">
                            <div className="absolute left-1/2 top-1 z-20 h-2 w-8 -translate-x-1/2 rounded-full bg-black" />
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={rightPhoneImage} alt="Right iPhone template preview" className="device-media-iphone" />
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    <div className={cn('space-y-4 text-center lg:text-left', isReverse && 'lg:text-right')}>
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-600 dark:text-amber-300">{item.subtitle}</p>
                      <h3 className="font-khmer-heading text-3xl leading-tight text-slate-900 dark:text-white sm:text-4xl">{item.title}</h3>
                      <p className="mx-auto max-w-xl text-base leading-7 text-slate-600 dark:text-slate-200 lg:mx-0">{item.description}</p>
                      <div>
                        <Link href={item.href}>
                          <Button className="group bg-amber-600 text-white transition-all duration-300 hover:bg-amber-700">
                            <span className="inline-flex items-center gap-1.5">
                              {item.ctaLabel}
                              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                            </span>
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#f8f3e8] py-16 dark:bg-[#0B0E14] sm:py-20">
          <div className="pointer-events-none absolute inset-0">
            <div className="premium-float absolute -left-24 top-16 h-72 w-72 rounded-full bg-gradient-to-br from-amber-300/35 via-yellow-200/16 to-transparent blur-3xl" />
            <div className="premium-float-delay absolute right-10 top-24 h-56 w-56 rounded-full bg-gradient-to-br from-amber-200/30 to-transparent blur-3xl" />
            <div className="premium-float absolute bottom-10 left-1/2 h-44 w-44 rounded-full border border-amber-200/30 bg-white/30" />
            <Sparkles className="premium-float absolute left-20 top-10 h-5 w-5 text-amber-500/60" />
            <Sparkles className="premium-float-delay absolute right-24 bottom-14 h-4 w-4 text-amber-400/55" />
          </div>

          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl border border-amber-200/55 bg-white/75 p-5 shadow-[0_30px_80px_-40px_rgba(217,119,6,0.28)] backdrop-blur-xl dark:border-amber-700/35 dark:bg-black/70 sm:p-8 lg:p-12">
              <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
                <div className="relative text-center lg:text-left">
                  <div className="pointer-events-none absolute -left-8 top-6 hidden opacity-35 lg:block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={Assets.decorativeDivider} alt="" className="h-44 w-auto object-contain" />
                  </div>

                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300 sm:text-sm sm:tracking-[0.18em]">
                    {isKhmer ? 'ស្វែងយល់ពីមុខងារពិសេសៗរបស់យើង' : 'Explore Our Premium Features'}
                  </p>
                  <h2 className="mt-3 max-w-2xl font-khmer-heading text-[1.75rem] leading-[1.25] sm:text-3xl lg:text-4xl">
                    <span
                      className="block whitespace-normal break-words bg-gradient-to-r from-amber-700 via-amber-500 to-amber-300 bg-clip-text text-transparent"
                      style={{ fontFamily: '"Khmer Pen-Surin", "Kantumruy Pro", var(--font-kantumruy-pro), sans-serif' }}
                    >
                      {isKhmer ? 'ងាយស្រួល សុវត្តិភាព' : 'Easy, Secure'}
                      <br />
                      {isKhmer ? 'ទំនុកចិត្តខ្ពស់' : 'Highly Trusted'}
                    </span>
                  </h2>
                  <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-700 dark:text-slate-200 sm:text-base lg:mx-0">
                    {isKhmer
                      ? 'ឧបករណ៍ទំនើបសម្រាប់រៀបចំព្រឹត្តិការណ៍ឱ្យមានរបៀប ស្រស់ស្អាត និងលេចធ្លោ ដោយរក្សាភាពថ្លៃថ្នូរបែប Khmer Digital Luxury។'
                      : 'Modern tools to organize your events with beauty, structure, and standout quality in a Khmer Digital Luxury style.'}
                  </p>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <Link href="/register" className="w-full sm:w-auto">
                      <Button className="group w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-[0_10px_24px_-14px_rgba(217,119,6,0.9)] transition-all duration-300 hover:from-amber-600 hover:to-amber-700 sm:w-auto">
                        <span className="inline-flex items-center gap-1.5">
                          {isKhmer ? 'ជ្រើស Template' : 'Select Template'}
                          <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                        </span>
                      </Button>
                    </Link>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => scrollToSection('services')}
                      className="w-full border-amber-300/70 bg-white/75 text-amber-700 hover:bg-amber-50 sm:w-auto dark:border-amber-400/45 dark:bg-[#0B0E14]/65 dark:text-amber-200 dark:hover:bg-[#141a24]"
                    >
                      {isKhmer ? 'មើលប្រភេទព្រឹត្តិការណ៍' : 'View Event Categories'}
                    </Button>
                  </div>

                  <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-amber-200/60 bg-white/75 p-4 backdrop-blur-xl">
                      <p className="text-xs uppercase tracking-[0.14em] text-amber-700/90">{isKhmer ? 'ស្វ័យប្រវត្តិ' : 'Automation'}</p>
                      <p className="mt-1 text-sm font-medium text-slate-800">{isKhmer ? 'RSVP ឆ្លាតវៃ និងលំហូរភ្ញៀវ' : 'Smart RSVP & Guest Flow'}</p>
                    </div>
                    <div className="rounded-2xl border border-amber-200/60 bg-white/75 p-4 backdrop-blur-xl">
                      <p className="text-xs uppercase tracking-[0.14em] text-amber-700/90">{isKhmer ? 'រចនា' : 'Design'}</p>
                      <p className="mt-1 text-sm font-medium text-slate-800">{isKhmer ? 'Template ខ្មែរបែបថ្លៃថ្នូរ' : 'Premium Khmer Templates'}</p>
                    </div>
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ duration: 0.65, ease: 'easeOut' }}
                  className="relative flex items-end justify-center px-2 py-6 sm:py-12"
                >
                  <div className="pointer-events-none absolute inset-0 -z-10 rounded-[2.8rem] bg-gradient-to-br from-amber-300/45 via-yellow-100/20 to-transparent blur-3xl" />

                  <div className="relative z-10 hidden w-[460px] transition-transform duration-500 hover:scale-105 sm:block lg:w-[620px]">
                    <div className="device-screen overflow-hidden rounded-t-xl border-[8px] border-gray-800 bg-gray-900 shadow-2xl dark:shadow-[0_26px_58px_-16px_rgba(0,0,0,0.72),0_0_28px_rgba(212,175,55,0.2)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={SHOWCASE_COMPUTER_IMAGE}
                        alt="Pithi Digital desktop preview"
                        className="device-media-crop"
                      />
                    </div>
                    <div className="-ml-[5%] h-4 w-[110%] rounded-b-xl bg-gray-700 shadow-lg" />
                  </div>

                  <div className="absolute bottom-5 right-[16%] z-30 hidden w-[92px] transition-transform duration-500 hover:scale-110 sm:block sm:w-[120px] lg:w-[140px]">
                    <div className="device-screen relative aspect-[9/19.5] overflow-hidden rounded-[1.5rem] border-[4px] border-gray-900 bg-black shadow-2xl dark:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.72),0_0_20px_rgba(212,175,55,0.24)]">
                      <div className="absolute left-1/2 top-1 z-20 h-2 w-8 -translate-x-1/2 rounded-full bg-black" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={SHOWCASE_IPHONE_IMAGE}
                        alt="Pithi Digital iPhone preview"
                        className="device-media-iphone"
                      />
                    </div>
                  </div>

                  <div className="absolute right-0 top-10 hidden rounded-2xl border border-amber-200/60 bg-white/80 p-3 backdrop-blur-xl sm:block">
                    <p className="text-xs font-medium text-slate-800">{isKhmer ? '+2.4K ភ្ញៀវបានគ្រប់គ្រង' : '+2.4K Guests Managed'}</p>
                  </div>

                </motion.div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-20 dark:bg-[#0B0E14]">
          <div className="mx-auto mb-8 w-full max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="font-khmer-heading text-2xl text-slate-900 sm:text-3xl dark:text-white">{isKhmer ? 'មតិអ្នកប្រើប្រាស់' : 'User Testimonials'}</h2>
            <p className="mt-2 text-slate-500 dark:text-slate-300">{isKhmer ? 'សម្ដីពិតពីអ្នកប្រើប្រាស់របស់យើង' : 'Real feedback from our users'}</p>
          </div>
          <div className="relative flex w-full flex-col items-center justify-center overflow-hidden py-2">
            <Marquee pauseOnHover className="[--duration:20s]">
              {firstRow.map((review) => (
                <ReviewCard
                  key={`top-${review.username}`}
                  img={review.img}
                  name={review.name}
                  username={review.username}
                  body={review.comment}
                />
              ))}
            </Marquee>
            <Marquee reverse pauseOnHover className="[--duration:20s]">
              {secondRow.map((review) => (
                <ReviewCard
                  key={`bottom-${review.username}`}
                  img={review.img}
                  name={review.name}
                  username={review.username}
                  body={review.comment}
                />
              ))}
            </Marquee>
            <div className="from-background pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r" />
            <div className="from-background pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l" />
          </div>
        </section>

        <section id="faq" className="bg-rose-50/40 py-20 dark:bg-slate-900/50">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
              <h2 className="font-khmer-heading text-2xl text-slate-900 sm:text-3xl dark:text-white">{isKhmer ? 'សំនួរដែលគេសួរញឹកញាប់' : 'Frequently Asked Questions'}</h2>
              <p className="mt-2 text-slate-500">{isKhmer ? 'ចម្លើយចំពោះសំនួរទូទៅ' : 'Answers to common questions'}</p>
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

      {/* Back to top */}
      <motion.button
        type="button"
        onClick={scrollToTop}
        aria-label="Back to top"
        initial={false}
        animate={
          showBackToTop
            ? { opacity: 1, y: 0, scale: 1, pointerEvents: 'auto' }
            : { opacity: 0, y: 18, scale: 0.94, pointerEvents: 'none' }
        }
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="group fixed bottom-4 right-3 z-[70] inline-flex h-20 w-16 origin-bottom-right scale-90 appearance-none border-0 flex-col items-center justify-center bg-transparent p-0 text-slate-800 outline-none ring-0 transition-all duration-300 hover:-translate-y-0.5 sm:bottom-5 sm:right-4 md:bottom-6 md:right-6 md:h-28 md:w-24 md:scale-100 dark:text-white"
      >
        <span className="back-to-top-chevrons" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="back-to-top-chevron">
            <path d="M6 15l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <svg viewBox="0 0 24 24" className="back-to-top-chevron delay-1">
            <path d="M6 15l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <svg viewBox="0 0 24 24" className="back-to-top-mouse" aria-hidden="true">
          <rect x="7" y="3.5" width="10" height="16.5" rx="5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <line x1="12" y1="6.4" x2="12" y2="9.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </motion.button>

      <footer id="contact" className="border-t border-slate-100 bg-white text-slate-700 dark:border-white/10 dark:bg-[#0B0E14] dark:text-slate-100">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={Assets.footerLogo} alt="Pithi Digital footer logo" className="h-32 w-auto object-contain sm:h-36" />
            <p className="mt-3 max-w-sm text-sm text-slate-500">
              {isKhmer
                ? 'ដំណោះស្រាយធៀបឌីជីថលទំនើប សម្រាប់ការរៀបចំព្រឹត្តិការណ៍របស់អ្នកឱ្យមានភាពងាយស្រួល និងស្រស់ស្អាត។'
                : 'A modern digital invitation solution to make your event planning easier and more beautiful.'}
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <a
                href="https://web.facebook.com/phuemnorngofficial/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-600"
                aria-label="Facebook"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d="M13.5 8.25V6.5c0-.82.68-1.5 1.5-1.5h1.5V2h-2.25A4.25 4.25 0 0 0 10 6.25v2H7.5v3H10V22h3.5V11.25H16l.5-3h-3z" />
                </svg>
              </a>
              <a
                href="https://t.me/Phuem_Norng"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-600"
                aria-label="Telegram"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d="M21.3 3.26a1.2 1.2 0 0 0-1.25-.2L3.2 10.06a1.2 1.2 0 0 0 .08 2.25l4.2 1.34 1.46 4.5a1.2 1.2 0 0 0 2 .52l2.46-2.52 4.27 3.1a1.2 1.2 0 0 0 1.9-.69l2.12-14.1a1.2 1.2 0 0 0-.39-1.2zm-3.9 12.45-4.08-2.96a1.2 1.2 0 0 0-1.55.1l-1.48 1.52-.84-2.58 6.98-5.67a.75.75 0 1 0-.95-1.16L6.53 12.2l-2.3-.74 14.2-5.88-1.03 10.13z" />
                </svg>
              </a>
              <a
                href="https://www.tiktok.com/@phuem_norng"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-600"
                aria-label="TikTok"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d="M14.5 3c.25 1.86 1.32 3.32 3.07 3.85.6.18 1.22.23 1.93.2V9.9c-1.54.05-3-.38-4.24-1.22v5.62c0 3.15-2.52 5.7-5.63 5.7S4 17.45 4 14.3 6.52 8.6 9.63 8.6c.4 0 .78.04 1.15.12v2.86a2.87 2.87 0 0 0-1.15-.24c-1.6 0-2.9 1.32-2.9 2.96 0 1.63 1.3 2.95 2.9 2.95s2.9-1.32 2.9-2.95V3h1.97z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 py-5 text-center text-xs text-slate-400">
          © 2026 Pithi Digital. {isKhmer ? 'រក្សាសិទ្ធិគ្រប់យ៉ាង។' : 'All rights reserved.'}
        </div>
      </footer>
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }

        .dark .premium-dark-bg {
          background-color: #0b0e14;
          background-image:
            radial-gradient(1200px 650px at 14% -8%, rgba(212, 175, 55, 0.1), transparent 58%),
            radial-gradient(900px 520px at 84% 0%, rgba(249, 226, 155, 0.07), transparent 52%),
            radial-gradient(700px 460px at 52% 92%, rgba(212, 175, 55, 0.05), transparent 60%);
          background-attachment: fixed;
        }

        .hero-float {
          animation: heroFloat 6.5s ease-in-out infinite;
        }

        .premium-float {
          animation: premiumFloat 7s ease-in-out infinite;
        }

        .premium-float-delay {
          animation: premiumFloat 8.5s ease-in-out infinite;
          animation-delay: 0.9s;
        }

        .device-screen {
          overflow: hidden;
          overscroll-behavior: none;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .device-screen::-webkit-scrollbar {
          width: 0;
          height: 0;
          display: none;
        }

        .device-media-crop {
          width: calc(100% + 14px);
          height: 100%;
          margin-right: -14px;
          display: block;
          object-fit: cover;
          object-position: center;
        }

        .device-media-iphone {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          object-position: top center;
          transform: translateY(-1%);
        }

        .scroll-mouse-indicator {
          position: relative;
          width: 22px;
          height: 34px;
          border: 1.5px solid rgba(100, 116, 139, 0.75);
          border-radius: 999px;
          backdrop-filter: blur(2px);
        }

        .scroll-mouse-wheel {
          position: absolute;
          left: 50%;
          top: 7px;
          width: 3px;
          height: 7px;
          border-radius: 999px;
          background: rgba(217, 119, 6, 0.75);
          transform: translateX(-50%);
          animation: mouseWheelScroll 1.35s ease-in-out infinite;
        }

        .back-to-top-chevrons {
          position: absolute;
          top: 0px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
          color: rgba(15, 23, 42, 0.88);
        }

        .back-to-top-chevron {
          width: 22px;
          height: 22px;
          opacity: 0;
          animation: backToTopChevronUp 1.45s ease-in-out infinite;
        }

        .back-to-top-chevron.delay-1 {
          animation-delay: 0.24s;
          color: rgba(100, 116, 139, 0.35);
        }

        .back-to-top-mouse {
          width: 42px;
          height: 64px;
          color: rgba(15, 23, 42, 0.92);
          animation: backToTopMouseFloat 2.2s ease-in-out infinite;
        }

        .dark .back-to-top-chevrons {
          color: rgba(255, 255, 255, 0.95);
        }

        .dark .back-to-top-chevron.delay-1 {
          color: rgba(255, 255, 255, 0.58);
        }

        .dark .back-to-top-mouse {
          color: rgba(255, 255, 255, 0.96);
        }

        .showcase-tab-loop {
          width: 100%;
          overflow: hidden;
        }

        .showcase-tab-track {
          width: max-content;
          will-change: transform;
          animation: showcaseTabsLoop 26s linear infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .showcase-tab-track {
            animation: none;
          }
        }

        .process-flow-line {
          top: 0;
          height: 0;
          border-top: 1.5px dashed rgba(217, 119, 6, 0.28);
        }

        .process-flow-line::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          top: -1px;
          height: 2px;
          background: linear-gradient(90deg, transparent 0%, rgba(217, 119, 6, 0.5) 45%, transparent 100%);
          background-size: 120px 100%;
          animation: processFlowMove 2.6s linear infinite;
        }

        .process-flow-arrow {
          position: absolute;
          right: -1px;
          top: 50%;
          width: 7px;
          height: 7px;
          transform: translateY(-50%) rotate(45deg);
          border-top: 1.5px solid rgba(217, 119, 6, 0.55);
          border-right: 1.5px solid rgba(217, 119, 6, 0.55);
          border-radius: 1px;
          background: transparent;
        }

        .process-flow-vertical {
          position: absolute;
          left: 50%;
          top: auto;
          bottom: 10px;
          height: 28px;
          width: 0;
          border-left: 1.5px dashed rgba(217, 119, 6, 0.28);
          transform: translateX(-50%);
          z-index: 0;
        }

        .process-flow-vertical::after {
          content: '';
          position: absolute;
          top: 0;
          left: -1px;
          width: 2px;
          height: 100%;
          background: linear-gradient(180deg, transparent 0%, rgba(217, 119, 6, 0.45) 50%, transparent 100%);
          animation: processFlowMoveVertical 2.6s linear infinite;
        }

        .process-flow-arrow-vertical {
          position: absolute;
          left: 50%;
          bottom: -1px;
          width: 7px;
          height: 7px;
          transform: translateX(-50%) rotate(135deg);
          border-top: 1.5px solid rgba(217, 119, 6, 0.55);
          border-right: 1.5px solid rgba(217, 119, 6, 0.55);
          border-radius: 1px;
        }


        @keyframes heroFloat {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
          100% {
            transform: translateY(0px);
          }
        }

        @keyframes premiumFloat {
          0% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(0, -10px, 0);
          }
          100% {
            transform: translate3d(0, 0, 0);
          }
        }

        @keyframes processFlowMove {
          from {
            background-position: 120px 0;
          }
          to {
            background-position: 0 0;
          }
        }

        @keyframes processFlowMoveVertical {
          from {
            background-position: 0 120px;
          }
          to {
            background-position: 0 0;
          }
        }

        @keyframes showcaseTabsLoop {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(-50%, 0, 0);
          }
        }

        @keyframes mouseWheelScroll {
          0% {
            transform: translate(-50%, 0);
            opacity: 0.9;
          }
          70% {
            transform: translate(-50%, 9px);
            opacity: 0.25;
          }
          100% {
            transform: translate(-50%, 0);
            opacity: 0.9;
          }
        }

        @keyframes backToTopChevronUp {
          0% {
            opacity: 0;
            transform: translateY(7px);
          }
          35% {
            opacity: 0.95;
          }
          100% {
            opacity: 0;
            transform: translateY(-5px);
          }
        }

        @keyframes backToTopMouseFloat {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-1.5px);
          }
        }

      `}</style>
    </div>
  );
}
