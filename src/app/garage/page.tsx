import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import GarageClient from './GarageClient'

export default async function GaragePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/garage')
  }

  // Fetch vehicles directly by user_id
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*')
    .eq('user_id', user.id)
    .eq('active', true)
    .order('created_at', { ascending: false })

  return <GarageClient vehicles={vehicles || []} />
}
