import { Event } from '@/app/actions/events'
import { EventRSVPButton } from './EventRSVPButton'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, MapPin, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function EventCard({ event }: { event: Event }) {
    const eventDate = new Date(event.start_time).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    })

    return (
        <Card className="flex flex-col h-full hover:shadow-lg transition-shadow border-l-4 border-l-primary/50">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-xl line-clamp-2">{event.title}</CardTitle>
                    <Badge variant="outline" className="capitalize shrink-0">{event.type.replace('_', ' ')}</Badge>
                </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 shrink-0 text-primary" />
                    <span>{eventDate}</span>
                </div>
                {(event.location_name || event.city) && (
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 shrink-0 text-primary" />
                        <span>
                            {event.location_name}
                            {event.location_name && event.city && ', '}
                            {event.city}
                        </span>
                    </div>
                )}
                {event.description && (
                    <p className="line-clamp-3 mt-2 text-foreground/80">
                        {event.description}
                    </p>
                )}
            </CardContent>
            <CardFooter className="pt-4 border-t flex justify-between items-center bg-muted/10">
                <div className="flex items-center gap-1.5 text-xs font-medium">
                    <Users className="h-3.5 w-3.5" />
                    <span>{event.attendees_count || 0} going</span>
                </div>
                <EventRSVPButton eventId={event.id} initialIsAttending={!!event.is_attending} />
            </CardFooter>
        </Card>
    )
}
