import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PitLane } from "@/components/PitLane";
import JsonLd from "@/components/JsonLd";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ImpersonationBarWrapper from "@/components/admin/ImpersonationBarWrapper";
import SuspendedBannerWrapper from "@/components/SuspendedBannerWrapper";
import AlphaBanner from "@/components/AlphaBanner";
import PageTracker from "@/components/analytics/PageTracker";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import MicrosoftClarity from "@/components/analytics/MicrosoftClarity";
import { Toaster } from 'sonner';
import Footer from "@/components/Footer";
import { TimeTracker } from "@/components/analytics/TimeTracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://gridpass.app"),
  title: {
    default: "GridPass",
    template: "%s | GridPass",
  },
  description: "The Business Operating System for Racing.",
  keywords: [
    "motorsports",
    "racing teams",
    "racing resume",
    "crew management",
    "motorsport jobs",
    "racing sponsorship",
    "indycar",
    "imsa",
    "sro",
    "formula 1",
    "karting",
    "sim racing",
  ],
  authors: [{ name: "Patrick Losey", url: "https://pjlosey.com" }],
  creator: "Patrick Losey",
  publisher: "GridPass",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "GridPass",
    description: "The Business Operating System for Racing. Managing teams, shops, and careers in one place.",
    url: "https://gridpass.app",
    siteName: "GridPass",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GridPass",
    description: "The Business Operating System for Racing.",
    creator: "@pjlosey",
    site: "@gridpassapp",
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

import { getUserRole } from "@/utils/rbac";

import FeedbackWidget from "@/components/FeedbackWidget";

import { createClient } from '@/utils/supabase/server';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = await getUserRole();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <JsonLd />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <GoogleAnalytics userEmail={user?.email} />
        <MicrosoftClarity />
        <AlphaBanner />
        <Navbar effectiveRole={role} />
        <ImpersonationBarWrapper />
        <SuspendedBannerWrapper />

        <PageTracker />
        <TimeTracker />
        <Toaster theme="dark" position="top-center" />
        <PitLane />
        {children}
        <FeedbackWidget />
        <Footer />
      </body>
    </html>
  );
}
