import type { Metadata } from "next";
import { Geist, Geist_Mono, Kantumruy_Pro, Moul } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const kantumruyPro = Kantumruy_Pro({
  variable: "--font-kantumruy-pro",
  subsets: ["khmer", "latin"],
});

const moul = Moul({
  variable: "--font-moul",
  subsets: ["khmer"],
  weight: "400",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pithi-digital-v1.vercel.app';

export const metadata: Metadata = {
  title: 'Pithi Digital - វេទិកាបង្កើតធៀបការឌីជីថលដ៏ទំនើប',
  description: 'រៀបចំពិធីមង្គលការរបស់អ្នកឱ្យកាន់តែពិសេស ជាមួយធៀបឌីជីថល គ្រប់គ្រងភ្ញៀវ និង RSVP ងាយស្រួល។',
  keywords: 'invitations, events, RSVP, digital, ធៀបការ, ពិធីមង្គលការ, Cambodia',
  metadataBase: new URL(APP_URL),
  openGraph: {
    title: 'Pithi Digital - វេទិកាបង្កើតធៀបការឌីជីថលដ៏ទំនើប',
    description: 'រៀបចំពិធីមង្គលការរបស់អ្នកឱ្យកាន់តែពិសេស ជាមួយធៀបឌីជីថល គ្រប់គ្រងភ្ញៀវ និង RSVP ងាយស្រួល។',
    url: APP_URL,
    siteName: 'Pithi Digital',
    images: [
      {
        url: '/main-thumbnail.jpg',
        width: 1200,
        height: 630,
        alt: 'Pithi Digital - វេទិកាបង្កើតធៀបការឌីជីថល',
      },
    ],
    type: 'website',
    locale: 'km_KH',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pithi Digital - វេទិកាបង្កើតធៀបការឌីជីថលដ៏ទំនើប',
    description: 'រៀបចំពិធីមង្គលការរបស់អ្នកឱ្យកាន់តែពិសេស ជាមួយធៀបឌីជីថល គ្រប់គ្រងភ្ញៀវ និង RSVP ងាយស្រួល។',
    images: ['/main-thumbnail.jpg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${kantumruyPro.variable} ${moul.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
