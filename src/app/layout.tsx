import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PitLane } from "@/components/PitLane";
import JsonLd from "@/components/JsonLd";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ImpersonationBarWrapper from "@/components/admin/ImpersonationBarWrapper";
import SuspendedBannerWrapper from "@/components/SuspendedBannerWrapper";
import PageTracker from "@/components/analytics/PageTracker";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import MicrosoftClarity from "@/components/analytics/MicrosoftClarity";
import { Toaster } from 'sonner';
import Footer from "@/components/Footer";

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
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

import { getUserRole } from "@/utils/rbac";

import FeedbackWidget from "@/components/FeedbackWidget";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
        <GoogleAnalytics />
        <MicrosoftClarity />
        <Navbar effectiveRole={role} />
        <ImpersonationBarWrapper />
        <SuspendedBannerWrapper />
        <SuspendedBannerWrapper />
        <PageTracker />
        <Toaster theme="dark" position="top-center" />
        <PitLane />
        {children}
        <FeedbackWidget />
        <Footer />
      </body>
    </html>
  );
}
