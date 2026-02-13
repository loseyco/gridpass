import type { Metadata } from 'next'
import './globals.css'
import BottomTabBar from './components/BottomTabBar'
import InstallPrompt from './components/InstallPrompt'
import V2LayoutClient from './V2LayoutClient'

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
                <V2LayoutClient isLoggedIn={!!user}>
                    {children}
                    <InstallPrompt />
                    <BottomTabBar isLoggedIn={!!user} />
                </V2LayoutClient>
            </body>
        </html>
    )
}
