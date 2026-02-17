
import React from 'react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import NewVehicleForm from './NewVehicleForm'

export default async function NewRentalPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/auth')
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <Link href="/apps/rentals/manage" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 mb-6 text-neutral-400 hover:text-white pl-0">
                    ← Back to Management
                </Link>

                <NewVehicleForm userId={user.id} />
            </div>
        </div>
    )
}
