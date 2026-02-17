
import React from 'react'
import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import BookingClient from './BookingClient'

export default async function VehicleDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth?next=/apps/rentals/vehicle/' + id)
    }

    const { data: vehicle, error } = await supabase
        .from('rental_vehicles')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !vehicle) {
        console.error('Vehicle not found', error)
        notFound()
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <Link href="/apps/rentals" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 mb-6 text-neutral-400 hover:text-white pl-0">
                    ← Back to Rentals
                </Link>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="aspect-video w-full bg-neutral-800 rounded-lg overflow-hidden border border-neutral-800 relative">
                            {vehicle.image_url ? (
                                <img
                                    src={vehicle.image_url}
                                    alt={vehicle.model}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-neutral-600">
                                    No Image
                                </div>
                            )}
                        </div>

                        <div>
                            <div className="flex justify-between items-start">
                                <h1 className="text-3xl font-bold">{vehicle.year} {vehicle.make} {vehicle.model}</h1>
                                <Badge variant="outline" className="text-orange-400 border-orange-500/50">
                                    {vehicle.type}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-neutral-400 mt-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                                {vehicle.location_name || 'Location Not Specified'}
                            </div>
                        </div>

                        <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-800">
                            <h2 className="text-lg font-semibold mb-2">Description</h2>
                            <p className="text-neutral-300 leading-relaxed">
                                {vehicle.description || 'No description provided by owner.'}
                            </p>
                        </div>
                    </div>

                    <div>
                        <BookingClient vehicle={vehicle} userId={user.id} />

                        {user.id === vehicle.owner_id && (
                            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-200 text-sm">
                                You own this vehicle. Visit the <Link href="/apps/rentals/manage" className="underline hover:text-white">Management Dashboard</Link> to edit it.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
