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
  title: {
    default: 'SHINQUIRO',
    template: '%s | SHINQUIRO'
  },
  description: '大学受験英語情報 シンキロウ - 教材探しの「なんとなく」を解消',
  openGraph: {
    title: 'SHINQUIRO|シンキロウ',
    description: '大学受験英語情報 シンキロウ - 教材探しの「なんとなく」を解消',
    siteName: 'SHINQUIRO',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: '大学受験英語情報 SHINQUIRO|シンキロウ - 教材探しの「なんとなく」を解消'
      }
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SHINQUIRO|シンキロウ',
    description: '大学受験英語情報',
    images: ['/opengraph-image.png'],
  },
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SHINQUIRO',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
