import type { Metadata, Viewport } from 'next'
import './globals.css'
import BottomTabBar from './components/BottomTabBar'
import InstallPrompt from './components/InstallPrompt'
import V2LayoutClient from './V2LayoutClient'
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics'
import MicrosoftClarity from '@/components/analytics/MicrosoftClarity'
import PageTracker from '@/components/analytics/PageTracker'
import { TimeTracker } from '@/components/analytics/TimeTracker'

import { createClient } from '@/utils/supabase/server'

export const metadata: Metadata = {
    title: 'GridPass',
    description: 'The Business Operating System for Racing',
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

export default async function V2Layout({
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
                <V2LayoutClient isLoggedIn={!!user}>
                    {children}
                    <InstallPrompt />
                    <BottomTabBar isLoggedIn={!!user} />
                </V2LayoutClient>
            </body>
        </html>
    )
}
