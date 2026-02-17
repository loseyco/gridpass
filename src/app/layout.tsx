import type { Metadata, Viewport } from 'next'
import './globals.css'
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics'
import MicrosoftClarity from '@/components/analytics/MicrosoftClarity'
import PageTracker from '@/components/analytics/PageTracker'
import { TimeTracker } from '@/components/analytics/TimeTracker'
import JsonLd from "@/components/JsonLd";
import { createClient } from '@/utils/supabase/server'

export const metadata: Metadata = {
    title: {
        template: '%s | GridPass',
        default: 'GridPass: Your Motorsports OS',
    },
    description: 'The Operating System for your Motorsports Life. Manage leagues, track stats, and connect with the sim racing community.',
    keywords: ['Sim Racing', 'League Management', 'iRacing', 'Motorsports', 'Racing', 'GridPass', 'Sim Racing Community'],
    authors: [{ name: 'GridPass Team' }],
    creator: 'GridPass',
    metadataBase: new URL('https://gridpass.app'),
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: 'https://gridpass.app',
        title: 'GridPass: Your Motorsports OS',
        description: 'The Operating System for your Motorsports Life. Manage leagues, track stats, and connect with the sim racing community.',
        siteName: 'GridPass',
        images: [
            {
                url: '/hero-launch.png',
                width: 1200,
                height: 630,
                alt: 'GridPass Preview',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'GridPass: Your Motorsports OS',
        description: 'The Operating System for your Motorsports Life.',
        images: ['/hero-launch.png'],
        creator: '@gridpassapp',
    },
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'GridPass',
    },
}

export const viewport: Viewport = {
    themeColor: '#e31e24',
}

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    return (
        <html lang="en">
            <body>
                <GoogleAnalytics userEmail={user?.email} />
                <MicrosoftClarity />
                <PageTracker />
                <TimeTracker />
                <JsonLd />
                {children}
            </body>
        </html>
    )
}
