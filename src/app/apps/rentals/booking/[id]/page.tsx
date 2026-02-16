
import React from 'react'
import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { QRCodeSVG } from 'qrcode.react'

export default async function BookingStatusPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/auth')
    }

    const { data: booking, error } = await supabase
        .from('rental_bookings')
        .select(`
            *,
            vehicle:rental_vehicles(*)
        `)
        .eq('id', id)
        .single()

    if (error || !booking) {
        notFound()
    }

    // Ensure user is renter or owner
    // @ts-ignore
    const isOwner = booking.vehicle.owner_id === user.id
    const isRenter = booking.renter_id === user.id

    if (!isOwner && !isRenter) {
        return <div className="p-8 text-center text-red-500">Unauthorized access to this booking.</div>
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-8">
            <div className="max-w-md mx-auto space-y-8 text-center">
                <Link href="/apps/rentals" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 absolute top-4 left-4 text-neutral-400">
                    ← Back
                </Link>

                <div className="pt-8">
                    <h1 className="text-2xl font-bold mb-2">Booking Access Pass</h1>
                    <p className="text-neutral-400 text-sm">
                        Show this QR code at the rental location to check in.
                    </p>
                </div>

                <div className="bg-white p-6 rounded-2xl inline-block mx-auto mb-6">
                    <QRCodeSVG value={booking.id} size={200} />
                </div>

                <div className="bg-neutral-900 rounded-xl p-6 text-left space-y-4 border border-neutral-800">
                    <div>
                        <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Status</div>
                        <Badge className={
                            booking.status === 'active' ? 'bg-green-500 text-black' :
                                booking.status === 'confirmed' ? 'bg-blue-500 text-white' :
                                    'bg-neutral-700'
                        }>
                            {booking.status}
                        </Badge>
                    </div>

                    <div>
                        <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Vehicle</div>
                        {/* @ts-ignore */}
                        <div className="font-semibold text-lg">{booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}</div>
                        {/* @ts-ignore */}
                        <div className="text-sm text-neutral-400">{booking.vehicle.type}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Start</div>
                            <div className="text-sm font-mono">{new Date(booking.start_time).toLocaleString()}</div>
                        </div>
                        <div>
                            <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">End</div>
                            <div className="text-sm font-mono">{new Date(booking.end_time).toLocaleString()}</div>
                        </div>
                    </div>

                    <div>
                        <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Total Price</div>
                        <div className="text-xl font-bold text-orange-400">${booking.total_price}</div>
                    </div>
                </div>

                {isOwner && (
                    <div className="space-y-2">
                        <p className="text-sm text-neutral-500">Owner Actions</p>
                        {booking.status === 'confirmed' && (
                            <form action={async () => {
                                'use server'
                                const supabase = await createClient()
                                await supabase.from('rental_bookings').update({ status: 'active' }).eq('id', id)
                                redirect(`/apps/rentals/booking/${id}`)
                            }}>
                                <Button className="w-full bg-green-600 hover:bg-green-700">Check In (Start Rental)</Button>
                            </form>
                        )}
                        {booking.status === 'active' && (
                            <form action={async () => {
                                'use server'
                                const supabase = await createClient()
                                await supabase.from('rental_bookings').update({ status: 'completed' }).eq('id', id)
                                redirect(`/apps/rentals/booking/${id}`)
                            }}>
                                <Button className="w-full bg-blue-600 hover:bg-blue-700">Check Out (Return Vehicle)</Button>
                            </form>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
