'use client'

import { useState } from 'react'
import { joinEvent } from '@/app/actions/events'
import { Button } from '@/components/ui/button'
import { Check, Plus } from 'lucide-react'
import { toast } from 'sonner' // Assuming sonner is installed as per package.json

export function EventRSVPButton({ eventId, initialIsAttending }: { eventId: string, initialIsAttending: boolean }) {
    const [isAttending, setIsAttending] = useState(initialIsAttending)
    const [isLoading, setIsLoading] = useState(false)

    const handleToggleRSVP = async () => {
        setIsLoading(true)
        try {
            await joinEvent(eventId)
            setIsAttending(!isAttending)
            toast.success(isAttending ? "You're no longer going." : "You're going!")
        } catch (error) {
            toast.error("Failed to update RSVP")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button
            variant={isAttending ? "secondary" : "default"}
            size="sm"
            onClick={handleToggleRSVP}
            disabled={isLoading}
        >
            {isAttending ? (
                <>
                    <Check className="mr-2 h-4 w-4" />
                    Going
                </>
            ) : (
                <>
                    <Plus className="mr-2 h-4 w-4" />
                    Join
                </>
            )}
        </Button>
    )
}
