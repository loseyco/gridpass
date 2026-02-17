import { createClient } from '@/utils/supabase/server'
import { Metadata } from 'next'
import HomeClient from './HomeClient'
import V2Landing from './V2Landing'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Manage your racing career, leagues, and news all in one place.',
  openGraph: {
    title: 'Dashboard | GridPass',
    description: 'Manage your racing career, leagues, and news all in one place.',
  },
}

export default async function V2Home() {
  const supabase = await createClient()

  // Get current user (optional - home works without login)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <V2Landing />
  }

  let userProfile = null

  if (user) {
    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .eq('id', user.id)
      .single()

    userProfile = profile
  }

  return (
    <HomeClient
      hasUser={!!user}
      userProfile={userProfile}
    />
  )
}
