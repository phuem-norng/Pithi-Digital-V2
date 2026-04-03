import type { Metadata } from 'next';

interface Props {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

async function fetchEvent(id: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const res = await fetch(`${apiUrl}/api/events/public/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const event = await fetchEvent(id);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pithi-digital-v1.vercel.app';

  if (!event) {
    return {
      title: 'លិខិតអញ្ជើញ | Pithi Digital',
      description: 'មើលលិខិតអញ្ជើញរបស់អ្នក',
    };
  }

  const title = event.title || 'លិខិតអញ្ជើញ';
  const date = event.date
    ? new Date(event.date).toLocaleDateString('km-KH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';
  const location = event.location || '';
  const description = [date, location].filter(Boolean).join(' · ');
  const image = event.coverImage || `${appUrl}/og-default.png`;
  const url = `${appUrl}/invitation/${id}`;

  return {
    title: `${title} | Pithi Digital`,
    description: description || 'មើលលិខិតអញ្ជើញរបស់អ្នក',
    openGraph: {
      title,
      description: description || 'មើលលិខិតអញ្ជើញរបស់អ្នក',
      url,
      siteName: 'Pithi Digital',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: 'website',
      locale: 'km_KH',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: description || 'មើលលិខិតអញ្ជើញរបស់អ្នក',
      images: [image],
    },
  };
}

export default function InvitationLayout({ children }: Props) {
  return <>{children}</>;
}
