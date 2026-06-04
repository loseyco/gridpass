import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
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
  },
  twitter: {
    card: "summary_large_image",
    title: "Gridpass | The Universal Vehicle Network",
    description: "Transform any vehicle into a connected digital asset with a single, permanent QR code tag.",
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
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
