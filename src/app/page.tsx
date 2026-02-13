import { createClient } from '@/utils/supabase/server'
import HomeClient from './HomeClient'
import V2Landing from './V2Landing'

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
      .select('full_name, avatar_url')
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
