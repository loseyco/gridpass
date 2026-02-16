'use client'

import React, { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function BookingActionButtons({ bookingId }: { bookingId: string }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const updateStatus = async (status: string) => {
        setLoading(true)
        const { error } = await supabase
            .from('rental_bookings')
            .update({ status })
            .eq('id', bookingId)

        if (error) {
            console.error(error)
            alert('Error updating booking')
        } else {
            router.refresh()
        }
        setLoading(false)
    }

    return (
        <div className="flex gap-2 mt-3">
            <Button
                size="sm"
                variant="secondary"
                className="w-full text-xs h-8 bg-green-500/10 text-green-500 hover:bg-green-500/20"
                onClick={() => updateStatus('confirmed')}
                disabled={loading}
            >
                Accept
            </Button>
            <Button
                size="sm"
                variant="ghost"
                className="w-full text-xs h-8 text-red-400 hover:bg-red-500/10"
                onClick={() => updateStatus('cancelled')}
                disabled={loading}
            >
                Decline
            </Button>
        </div>
    )
}
