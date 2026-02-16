
import React from 'react'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default async function RentalsPage() {
    const supabase = await createClient()

    const { data: vehicles, error } = await supabase
        .from('rental_vehicles')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching rentals:', error)
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-amber-200 bg-clip-text text-transparent">
                            Start Your Engines
                        </h1>
                        <p className="text-neutral-400 mt-2">
                            Rent golf carts, pit bikes, and more for your event.
                        </p>
                    </div>
                    <Link href="/apps/rentals/manage" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-orange-500/20 text-orange-400 hover:bg-orange-500/10 h-10 px-4 py-2">
                        List Your Vehicle
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vehicles?.map((vehicle) => (
                        <Card key={vehicle.id} className="bg-neutral-900 border-neutral-800 overflow-hidden hover:border-orange-500/50 transition-colors">
                            <div className="aspect-video w-full bg-neutral-800 relative">
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
                                <Badge className="absolute top-2 right-2 bg-black/50 backdrop-blur border-neutral-700">
                                    {vehicle.type}
                                </Badge>
                            </div>
                            <CardHeader>
                                <CardTitle className="flex justify-between items-start gap-2">
                                    <span className="truncate">{vehicle.year} {vehicle.make} {vehicle.model}</span>
                                </CardTitle>
                                <div className="text-sm text-neutral-400 flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                                    {vehicle.location_name || 'Location N/A'}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-neutral-400 line-clamp-2 min-h-[2.5rem]">
                                    {vehicle.description || 'No description provided.'}
                                </p>
                            </CardContent>
                            <CardFooter className="flex justify-between items-center border-t border-neutral-800 pt-4">
                                <div className="flex flex-col">
                                    <span className="text-lg font-bold text-white">
                                        ${vehicle.price_per_day} <span className="text-xs font-normal text-neutral-500">/day</span>
                                    </span>
                                    {vehicle.price_per_hour && (
                                        <span className="text-xs text-neutral-500">
                                            or ${vehicle.price_per_hour}/hr
                                        </span>
                                    )}
                                </div>
                                <Link href={`/apps/rentals/vehicle/${vehicle.id}`} className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-orange-500 hover:bg-orange-600 text-black font-semibold h-10 px-4 py-2">
                                    Book Now
                                </Link>
                            </CardFooter>
                        </Card>
                    ))}

                    {(!vehicles || vehicles.length === 0) && (
                        <div className="col-span-full py-12 text-center text-neutral-500 space-y-4">
                            <p>No vehicles available for rent right now.</p>
                            <Link href="/apps/rentals/manage" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2">
                                Be the first to list one!
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
