import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Another Bowl",
  description: "Fresh food. Clean energy. Weekly run club in Ipswich.",
  keywords: ["healthy food", "smoothie bowls", "run club", "Ipswich", "clean eating", "community", "fitness"],
  authors: [{ name: "Another Bowl" }],
  creator: "Another Bowl",
  publisher: "Another Bowl",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://another-bowl-site.netlify.app/'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Another Bowl",
    description: "Fresh food. Clean energy. Weekly run club in Ipswich.",
    url: 'https://another-bowl-site.netlify.app/',
    siteName: 'Another Bowl',
    images: [
      {
        url: '/images/another-bowl-logo.jpeg',
        width: 1200,
        height: 630,
        alt: 'Another Bowl - Fresh food and community in Ipswich',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Favicon */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Theme Color */}
        <meta name="theme-color" content="#FF3E86" />
        <meta name="msapplication-TileColor" content="#FF3E86" />
        
        {/* Additional Meta Tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="application-name" content="Another Bowl" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Another Bowl" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Preconnect for Performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
