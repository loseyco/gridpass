import Link from 'next/link'
import BottomTabBar from '../components/BottomTabBar'
import DesktopNavbar from '../components/DesktopNavbar'
import MobileTopBar from '../components/MobileTopBar'
import InstallPrompt from '../components/InstallPrompt'
import V2LayoutClient from './V2LayoutClient'
import { createClient } from '@/utils/supabase/server'

export default async function MainLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let userProfile = null
    if (user) {
        const { data } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .single()
        userProfile = data
    }

    return (
        <V2LayoutClient isLoggedIn={!!user}>
            <MobileTopBar referralUser={userProfile?.username} />
            <DesktopNavbar isLoggedIn={!!user} referralUser={userProfile?.username} />
            <div className="pt-16 pb-20 md:pb-0 min-h-screen">
                {children}
            </div>
            <InstallPrompt />
            <BottomTabBar isLoggedIn={!!user} />
        </V2LayoutClient>
    )
}
