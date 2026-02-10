'use client'

import { createEvent } from '@/app/actions/events'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export function CreateEventForm() {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    async function onSubmit(formData: FormData) {
        setIsLoading(true)
        try {
            await createEvent(formData)
            toast.success('Event created successfully!')
            router.push('/social')
        } catch (error) {
            toast.error('Failed to create event. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form action={onSubmit}>
            <Card className="w-full max-w-2xl mx-auto shadow-lg">
                <CardHeader>
                    <CardTitle>Create New Event</CardTitle>
                    <CardDescription>Host a meetup, watch party, or track day.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="title">Event Title</Label>
                        <Input id="title" name="title" placeholder="e.g. F1 Watch Party at The Paddock" required />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="type">Event Type</Label>
                            <select
                                id="type"
                                name="type"
                                required
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="" disabled selected>Select type</option>
                                <option value="social">Social</option>
                                <option value="meetup">Meetup</option>
                                <option value="track_day">Track Day</option>
                                <option value="watch_party">Watch Party</option>
                                <option value="drinks">Drinks</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="start_time">Date & Time</Label>
                            <Input
                                id="start_time"
                                name="start_time"
                                type="datetime-local"
                                required
                                className="block"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="location_name">Location Name</Label>
                        <Input id="location_name" name="location_name" placeholder="e.g. Joe's Bar & Grill" required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            name="description"
                            placeholder="Tell people what to expect..."
                            className="min-h-[100px]"
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Event
                    </Button>
                </CardFooter>
            </Card>
        </form>
    )
}
