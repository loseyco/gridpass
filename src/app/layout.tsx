import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ImpersonationBarWrapper from "@/components/admin/ImpersonationBarWrapper";
import SuspendedBannerWrapper from "@/components/SuspendedBannerWrapper";
import PageTracker from "@/components/analytics/PageTracker";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import MicrosoftClarity from "@/components/analytics/MicrosoftClarity";

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
    icon: "/logo-square.png",
    shortcut: "/logo-square.png",
    apple: "/logo-square.png",
  },
};

import { getUserRole } from "@/utils/rbac";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const role = await getUserRole();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GoogleAnalytics />
        <MicrosoftClarity />
        <Navbar effectiveRole={role} />
        <ImpersonationBarWrapper />
        <SuspendedBannerWrapper />
        <PageTracker />
        {children}
      </body>
    </html>
  );
}
