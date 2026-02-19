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

  // Fetch profiles from os_user_profiles
  const { data: profiles } = await supabase
    .from('os_user_profiles')
    .select('id, username, first_name, last_name, avatar_url, target_role, bio, is_open_to_work')
    .order('created_at', { ascending: false })
    .limit(100)

  // Map to client interface
  const mappedProfiles = (profiles || []).map(p => ({
    id: p.id,
    username: p.username,
    full_name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.username,
    avatar_url: p.avatar_url,
    role: p.target_role,
    bio: p.bio,
    is_open_to_work: p.is_open_to_work
  }))

  return <MembersClient initialProfiles={mappedProfiles} user={user} />
}
