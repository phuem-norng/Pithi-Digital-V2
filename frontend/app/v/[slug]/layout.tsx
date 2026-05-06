import type { Metadata } from 'next';
import { Assets } from '@/lib/assets';

interface Props {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pithi-digital-v1.vercel.app';

async function fetchEvent(slug: string) {
  try {
    const res = await fetch(`${API_URL}/api/events/public/slug/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/** Resolve cover image to an absolute URL Telegram/Facebook can crawl */
function resolveImageUrl(coverImage?: string): string {
  if (!coverImage) return Assets.mainThumbnail;
  if (coverImage.startsWith('http://') || coverImage.startsWith('https://')) return coverImage;
  // Relative path served by the backend (e.g. /uploads/filename.avif)
  return `${API_URL}${coverImage.startsWith('/') ? '' : '/'}${coverImage}`;
}

/** Extract couple names from metadata or event title */
function buildOgTitle(event: { title?: string; metadata?: Record<string, unknown> }): string {
  const meta = (event.metadata || {}) as Record<string, unknown>;
  const groom = typeof meta.groomName === 'string' ? meta.groomName.trim() : '';
  const bride = typeof meta.brideName === 'string' ? meta.brideName.trim() : '';

  if (groom && bride) return `Online Invitation - ${groom} & ${bride} | Pithi Digital`;
  if (groom || bride) return `Online Invitation - ${groom || bride} | Pithi Digital`;

  // Fall back to splitting the title the same way DigitalInvitation does
  const t = event.title || '';
  if (t.includes(' និង ')) {
    const [g, b] = t.split(' និង ').map((s) => s.trim());
    if (g && b) return `Online Invitation - ${g} & ${b} | Pithi Digital`;
  }
  if (t.includes('&')) {
    const [g, b] = t.split('&').map((s) => s.trim());
    if (g && b) return `Online Invitation - ${g} & ${b} | Pithi Digital`;
  }

  return t ? `Online Invitation - ${t} | Pithi Digital` : 'Online Invitation | Pithi Digital';
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await fetchEvent(slug);

  if (!event) {
    return {
      title: 'លិខិតអញ្ជើញ | Pithi Digital',
      description: 'មើលលិខិតអញ្ជើញរបស់អ្នក',
    };
  }

  const ogTitle = buildOgTitle(event);
  const date = event.date
    ? new Date(event.date).toLocaleDateString('km-KH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';
  const location = event.location || '';
  const description =
    [date, location].filter(Boolean).join(' · ') ||
    'ធៀបអញ្ជើញឌីជីថលស្រស់ស្អាត អាចមើល និងឆ្លើយ RSVP បានភ្លាមៗ';
  const image = resolveImageUrl(event.coverImage);
  const url = `${APP_URL}/v/${slug}`;

  return {
    title: ogTitle,
    description,
    openGraph: {
      title: ogTitle,
      description,
      url,
      siteName: 'Pithi Digital',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: ogTitle,
        },
      ],
      type: 'website',
      locale: 'km_KH',
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
      images: [image],
    },
  };
}

export default function SlugLayout({ children }: Props) {
  return <>{children}</>;
}
