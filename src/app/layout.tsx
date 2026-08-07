import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { AppShell } from "@/components/AppShell";
import { ToastProvider } from "@/components/ToastContext";
import DailyRewardChecker from "@/components/auth/DailyRewardChecker";
import { GridpassTelemetryProvider } from "@/components/analytics/GridpassTelemetryProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://gridpass.app'),
  title: "Gridpass | One Tag for Everything",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: '/gridpass_emblem.jpg', type: 'image/jpeg' }, { url: '/favicon.ico' }],
    apple: [{ url: '/gridpass_emblem.jpg', type: 'image/jpeg' }],
  },
  description: "Whether you race it, show it, cook it, or capture it—Gridpass brings your world together with one universal QR tag for vehicles, events, food trucks, vendors, spotters, and venues.",
  keywords: ["gridpass", "one tag", "vehicles", "events", "vendors", "venues", "food trucks", "spotters", "qr tag", "digital passport"],
  openGraph: {
    title: "Gridpass | One Tag for Everything",
    description: "Whether you race it, show it, cook it, or capture it—Gridpass brings your world together.",
    url: "https://gridpass.app",
    siteName: "Gridpass",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://gridpass.app/gridpass_emblem.jpg",
        width: 1200,
        height: 630,
        alt: "Gridpass | One Tag for Everything",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gridpass | One Tag for Everything",
    description: "Whether you race it, show it, cook it, or capture it—Gridpass brings your world together.",
    images: ["https://gridpass.app/gridpass_emblem.jpg"],
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#060608] text-[#f4f4f7]">
        <AuthProvider>
          <ToastProvider>
            <GridpassTelemetryProvider>
              <DailyRewardChecker />
              <AppShell>
                {children}
              </AppShell>
            </GridpassTelemetryProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

