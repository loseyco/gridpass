import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { AppShell } from "@/components/AppShell";

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
  title: "Gridpass | The Universal Vehicle Network",
  description: "Transform any vehicle—car, boat, motorcycle, or plane—into a connected digital asset. Get a universal QR tag for service records, event entries, and ownership transfers.",
  keywords: ["gridpass", "vehicle network", "qr tag", "car community", "digital garage", "service logs", "ownership transfer"],
  openGraph: {
    title: "Gridpass | The Universal Vehicle Network",
    description: "Transform any vehicle into a connected digital asset with a single, permanent QR code tag.",
    url: "https://gridpass.app",
    siteName: "Gridpass",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Gridpass | The Universal Vehicle Network",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gridpass | The Universal Vehicle Network",
    description: "Transform any vehicle into a connected digital asset with a single, permanent QR code tag.",
    images: ["/opengraph-image"],
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
          <AppShell>
            {children}
          </AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
