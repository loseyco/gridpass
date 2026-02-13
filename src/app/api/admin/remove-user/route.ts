import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const target = searchParams.get('target')

    if (!target) return NextResponse.json({ error: 'Target required' }, { status: 400 })

    const supabase = createAdminClient()

    // 1. Get all users
    try {
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

        if (listError) {
            console.error('List users error:', listError)
            return NextResponse.json({ error: listError.message, details: listError }, { status: 500 })
        }

        // 2. Find user
        const userToDelete = users.find(user => {
            const email = user.email?.toLowerCase() || ''
            const username = user.user_metadata?.username?.toLowerCase() || ''
            return email.includes(target.toLowerCase()) || username.includes(target.toLowerCase())
        })

        if (!userToDelete) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 })
        }

        const userId = userToDelete.id

        // 3. Delete dependents
        // Vehicles
        const { error: vError } = await supabase.from('vehicles').delete().eq('user_id', userId)
        if (vError) console.error('Vehicles delete error:', vError)

        // User Connections
        const { error: ucError1 } = await supabase.from('user_connections').delete().eq('user_id', userId)
        if (ucError1) console.error('UC1 delete error:', ucError1)

        const { error: ucError2 } = await supabase.from('user_connections').delete().eq('connected_user_id', userId)
        if (ucError2) console.error('UC2 delete error:', ucError2)

        // Profiles
        const { error: pError } = await supabase.from('profiles').delete().eq('id', userId)
        if (pError) console.error('Profiles delete error:', pError)

        // 4. Delete Auth User
        const { error } = await supabase.auth.admin.deleteUser(userId)

        if (error) {
            return NextResponse.json({ error: error.message, location: 'AUTH DELETE' }, { status: 200 })
        }

        return NextResponse.json({
            message: 'Deleted user',
            user: {
                id: userToDelete.id,
                email: userToDelete.email,
                username: userToDelete.user_metadata?.username
            }
        })
    } catch (err: any) {
        console.error('Unexpected error:', err)
        return NextResponse.json({ error: 'Unexpected error', details: err.message }, { status: 200 })
    }
}
