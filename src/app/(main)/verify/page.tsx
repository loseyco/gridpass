import { createClient } from '@/utils/supabase/server'
import VerifyPageClient from './VerifyPageClient'
import { redirect } from 'next/navigation'

export default async function VerifyPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return <VerifyPageClient user={user} />
}
