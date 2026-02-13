import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { getGarage } from '@/actions/garage-actions'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Not logged in - redirect to login
    redirect('/login?next=/profile')
  }

  // Fetch profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return <div>Profile not found</div>
  }



  // Fetch personal collection (default one)
  const { data: personalCollection } = await supabase
    .from('collections')
    .select('id')
    .eq('owner_id', user.id)
    .eq('is_default', true)
    .single()

  let vehicles: any[] = []
  let vehicleCount = 0

  if (personalCollection) {
    // Fetch vehicles from the default collection
    const { data: collectionVehicles, count } = await supabase
      .from('user_vehicles')
      .select('*', { count: 'exact' })
      .eq('collection_id', personalCollection.id)
      .order('created_at', { ascending: false })

    vehicles = collectionVehicles || []
    vehicleCount = count || 0
  }

  // Fetch connections count
  const { count: connectionsCount } = await supabase
    .from('user_connections')
    .select('*', { count: 'exact', head: true })
    .or(`user_id.eq.${user.id},connected_user_id.eq.${user.id}`)
    .eq('status', 'accepted')

  // Get member year
  const memberSince = new Date(profile.created_at).getFullYear()

  // Check for verified badge
  const isVerified = profile.role === 'verified' || profile.role === 'pro' || profile.is_verified === true

  // Fetch media gallery
  const { data: mediaItems } = await supabase
    .from('profile_media')
    .select('*')
    .eq('user_id', user.id) // Changed from profile_id to user_id
    .order('created_at', { ascending: true }) // Changed order field if needed

  // Fetch recommendations
  const { data: recommendations } = await supabase
    .from('recommendations')
    .select('*, from_profile:profiles!author_id(full_name, username, avatar_url)')
    .eq('target_user_id', user.id) // Changed from to_user_id
    .eq('status', 'approved')
    .order('created_at', { ascending: false })


  return (
    <ProfileClient
      profile={profile}
      vehicleCount={vehicles?.length || 0}
      connectionsCount={connectionsCount || 0}
      memberSince={memberSince}
      isVerified={isVerified}
    />
  )
}
