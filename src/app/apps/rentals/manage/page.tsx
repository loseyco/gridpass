
import React from 'react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Car, Calendar, Plus } from 'lucide-react'
import BookingActionButtons from './BookingActionButtons'

export default async function ManageRentalsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/auth')
    }

    const { data: myVehicles } = await supabase
        .from('rental_vehicles')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

    const { data: incomingBookings } = await supabase
        .from('rental_bookings')
        .select(`
            *,
            vehicle:rental_vehicles!inner(make, model)
        `)
        .eq('vehicle.owner_id', user.id) // This relies on the inner join and RLS
        .neq('status', 'completed')
        .neq('status', 'cancelled')
        .order('start_time', { ascending: true })

    return (
        <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Rental Management</h1>
                        <p className="text-neutral-400">Manage your fleet and bookings.</p>
                    </div>
                    <Link href="/apps/rentals/manage/new" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-orange-500 hover:bg-orange-600 text-black h-10 px-4 py-2">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Vehicle
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* My Vehicles */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold flex items-center">
                            <Car className="w-5 h-5 mr-2" />
                            My Vehicles
                        </h2>
                        {myVehicles?.map(vehicle => (
                            <Card key={vehicle.id} className="bg-neutral-900 border-neutral-800">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between">
                                        <CardTitle className="text-lg">{vehicle.year} {vehicle.make} {vehicle.model}</CardTitle>
                                        <Badge variant="outline" className={
                                            vehicle.status === 'available' ? 'text-green-400 border-green-500/20' :
                                                'text-neutral-400 border-neutral-700'
                                        }>
                                            {vehicle.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm text-neutral-400">
                                        Type: {vehicle.type}
                                    </div>
                                    <div className="text-sm font-semibold mt-1">
                                        ${vehicle.price_per_day}/day
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {(!myVehicles || myVehicles.length === 0) && (
                            <p className="text-neutral-500 text-sm italic">You haven't listed any vehicles yet.</p>
                        )}
                    </div>

                    {/* Incoming Bookings */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold flex items-center">
                            <Calendar className="w-5 h-5 mr-2" />
                            Recent Bookings
                        </h2>
                        {incomingBookings?.map(booking => (
                            <Card key={booking.id} className="bg-neutral-900 border-neutral-800">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-base">
                                            {/* @ts-ignore relationship typing */}
                                            {booking.vehicle.make} {booking.vehicle.model}
                                        </CardTitle>
                                        <Badge className={
                                            booking.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20' :
                                                booking.status === 'confirmed' ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' :
                                                    'bg-neutral-800'
                                        }>
                                            {booking.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-xs text-neutral-400 space-y-1">
                                        <div>From: {new Date(booking.start_time).toLocaleString()}</div>
                                        <div>To: {new Date(booking.end_time).toLocaleString()}</div>
                                        <div className="font-semibold text-white mt-1">
                                            Total: ${booking.total_price}
                                        </div>
                                    </div>
                                    {booking.status === 'pending' ? (
                                        <BookingActionButtons bookingId={booking.id} />
                                    ) : (
                                        <Link href={`/apps/rentals/booking/${booking.id}`} className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-neutral-700 bg-background hover:bg-accent hover:text-accent-foreground h-8 rounded-md px-3 w-full mt-3 text-xs">
                                            Manage / Check-in
                                        </Link>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                        {(!incomingBookings || incomingBookings.length === 0) && (
                            <p className="text-neutral-500 text-sm italic">No recent bookings found.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
