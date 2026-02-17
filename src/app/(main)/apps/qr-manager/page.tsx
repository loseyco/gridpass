import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import QrManagerClient from './QrManagerClient'

export default async function QrManagerPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return <QrManagerClient />
}
