'use client'

import React, { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface BookingClientProps {
    vehicle: {
        id: string
        price_per_day: number
        price_per_hour: number | null
        owner_id: string
    }
    userId: string
}

export default function BookingClient({ vehicle, userId }: BookingClientProps) {
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const calculateTotal = () => {
        if (!startTime || !endTime) return 0
        const start = new Date(startTime).getTime()
        const end = new Date(endTime).getTime()
        const diffHours = (end - start) / (1000 * 60 * 60)

        if (diffHours <= 0) return 0

        if (vehicle.price_per_hour && diffHours < 24) {
            return diffHours * vehicle.price_per_hour
        } else {
            const days = Math.ceil(diffHours / 24)
            return days * vehicle.price_per_day
        }
    }

    const total = calculateTotal()

    const handleBooking = async () => {
        if (!startTime || !endTime) return
        setLoading(true)

        const { error } = await supabase
            .from('rental_bookings')
            .insert({
                vehicle_id: vehicle.id,
                renter_id: userId,
                start_time: new Date(startTime).toISOString(),
                end_time: new Date(endTime).toISOString(),
                total_price: total,
                status: 'pending',
                payment_status: 'unpaid'
            })

        if (error) {
            console.error(error)
            alert('Failed to book vehicle: ' + error.message)
        } else {
            alert('Booking request sent!')
            router.push('/apps/rentals')
        }
        setLoading(false)
    }

    return (
        <div className="space-y-6 bg-neutral-900 p-6 rounded-lg border border-neutral-800">
            <h3 className="text-xl font-bold text-white">Book this Vehicle</h3>

            <div className="space-y-2">
                <Label htmlFor="start-time" className="text-neutral-300">Start Time</Label>
                <Input
                    id="start-time"
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="bg-neutral-800 border-neutral-700 text-white"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="end-time" className="text-neutral-300">End Time</Label>
                <Input
                    id="end-time"
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="bg-neutral-800 border-neutral-700 text-white"
                />
            </div>

            <div className="pt-4 border-t border-neutral-800">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-neutral-400">Total Estimate</span>
                    <span className="text-2xl font-bold text-orange-400">
                        ${total.toFixed(2)}
                    </span>
                </div>

                <Button
                    onClick={handleBooking}
                    disabled={loading || total <= 0}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-black font-bold"
                >
                    {loading ? 'Processing...' : 'Request Booking'}
                </Button>
            </div>
            <p className="text-xs text-neutral-500 text-center">
                You won't be charged yet. The owner needs to confirm.
            </p>
        </div>
    )
}
