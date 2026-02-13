import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import V2MediaEditor from './V2MediaEditor'

export default async function MediaEditPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login?next=/profile/edit/media')
    }

    return <V2MediaEditor userId={user.id} />
}
