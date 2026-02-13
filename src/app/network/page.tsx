import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import NetworkClient from './NetworkClient'

export default async function NetworkPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/network')
  }

  // Fetch connections
  const { data: connections } = await supabase
    .from('user_connections')
    .select(`
            *,
            connected_user:profiles!user_connections_connected_user_id_fkey(id, full_name, username, avatar_url, role),
            initiator:profiles!user_connections_user_id_fkey(id, full_name, username, avatar_url, role)
        `)
    .or(`user_id.eq.${user.id},connected_user_id.eq.${user.id}`)
    .eq('status', 'accepted')

  // Normalize connections list (we want the "other" person)
  const people = connections?.map(conn => {
    const isInitiator = conn.user_id === user.id
    const profile = isInitiator ? conn.connected_user : conn.initiator
    return {
      ...profile,
      connection_id: conn.id,
      connected_at: conn.created_at
    }
  }) || []

  return <NetworkClient people={people} />
}
