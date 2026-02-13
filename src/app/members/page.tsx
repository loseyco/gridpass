import { createClient } from '@/utils/supabase/server'
import MembersClient from './MembersClient'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Members | GridPass',
  description: 'Connect with other racers and industry professionals on GridPass.',
}

export default async function MembersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch profiles
  // Limiting to 100 for now to prevent massive load
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, role, bio')
    .order('full_name', { ascending: true })
    .limit(100)

  return <MembersClient initialProfiles={profiles || []} user={user} />
}
