import type { Metadata } from "next";
import { Geist, Geist_Mono, Kantumruy_Pro, Moul } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import "@/components/logo-loop.css";
import { AuthProvider } from "@/lib/auth-context";
import { LanguageProvider } from "@/lib/language-context";
import { SuppressFedCMError } from "@/components/suppress-fedcm-error";
import { Assets } from "@/lib/assets";

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
  title: 'Online Invitation - Pithi Digital',
  description: 'ធៀបអញ្ជើញឌីជីថលទំនើប សម្រាប់បង្កើតកម្មវិធី ចែករំលែកទៅភ្ញៀវ និងគ្រប់គ្រង RSVP ងាយស្រួល។',
  keywords: 'invitations, events, RSVP, digital, ធៀបការ, ពិធីមង្គលការ, Cambodia',
  metadataBase: new URL(APP_URL),
  icons: {
    icon: [
      { url: Assets.webLogo, type: 'image/png', sizes: 'any' },
      { url: Assets.logo, type: 'image/png', sizes: '512x512' },
    ],
    shortcut: [Assets.webLogo],
    apple: [
      { url: Assets.logo, type: 'image/png', sizes: '180x180' },
    ],
  },
  openGraph: {
    title: 'Online Invitation - Pithi Digital',
    description: 'ធៀបអញ្ជើញឌីជីថលទំនើប សម្រាប់បង្កើតកម្មវិធី ចែករំលែកទៅភ្ញៀវ និងគ្រប់គ្រង RSVP ងាយស្រួល។',
    url: APP_URL,
    siteName: 'Pithi Digital',
    images: [
      {
        url: Assets.mainThumbnail,
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
    title: 'Online Invitation - Pithi Digital',
    description: 'ធៀបអញ្ជើញឌីជីថលទំនើប សម្រាប់បង្កើតកម្មវិធី ចែករំលែកទៅភ្ញៀវ និងគ្រប់គ្រង RSVP ងាយស្រួល។',
    images: [Assets.mainThumbnail],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${kantumruyPro.variable} ${moul.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-300">
        <SuppressFedCMError />
        <LanguageProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </LanguageProvider>
        {/* Keep Render backend awake so OG metadata fetches don't timeout */}
        {apiUrl && (
          <Script id="keep-render-awake" strategy="afterInteractive">
            {`
              (function(){
                var url = ${JSON.stringify(apiUrl + '/api/health')};
                function ping(){ fetch(url, {method:'GET',mode:'no-cors'}).catch(function(){}); }
                ping();
                setInterval(ping, 14 * 60 * 1000);
              })();
            `}
          </Script>
        )}
      </body>
    </html>
  );
}
