
import { getEvents } from '@/app/actions/events'
import { EventCard } from '@/components/social/EventCard'
import { CreateEventButton } from '@/components/social/CreateEventButton'
import { Input } from '@/components/ui/input'
import { Search, MapPin, CalendarDays } from 'lucide-react'

export default async function SocialPage({ searchParams }: { searchParams: Promise<{ q?: string, type?: string }> }) {
    const { q: query, type } = await searchParams

    const events = await getEvents({ search: query, type })

    return (
        <div className="container mx-auto py-8 space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                        Grid Pass After Dark
                    </h1>
                    <p className="text-muted-foreground mt-2 max-w-2xl">
                        Connect with the local racing community. Find meetups, track days, and social events happening near you.
                    </p>
                </div>
                <CreateEventButton />
            </div>

            {/* Filters Section */}
            <div className="flex flex-col md:flex-row gap-4 bg-muted/30 p-4 rounded-lg border border-border/50">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search events..."
                        className="pl-9 bg-background/50"
                        defaultValue={query}
                    />
                </div>
                {/* Future: Location Filter */}
                <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Location (coming soon)..."
                        className="pl-9 bg-background/50"
                        disabled
                    />
                </div>
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.length > 0 ? (
                    events.map((event) => (
                        <EventCard key={event.id} event={event} />
                    ))
                ) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-16 text-center space-y-4 border border-dashed rounded-lg bg-muted/10">
                        <CalendarDays className="h-12 w-12 text-muted-foreground/50" />
                        <div className="text-xl font-medium">No upcoming events found</div>
                        <p className="text-muted-foreground">Be the first to start the party!</p>
                        <CreateEventButton variant="outline" />
                    </div>
                )}
            </div>
        </div>
    )
}
