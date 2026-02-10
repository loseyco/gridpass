import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import EmptyState from '@/components/ui/EmptyState';
import { Armchair, UserPlus } from 'lucide-react';

export default async function MatchmakingPage() {
    const supabase = await createClient();

    // Fetch Racing Seats
    const { data: seats } = await supabase
        .from('racing_seats')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false });

    // Fetch Driver Requests
    const { data: requests } = await supabase
        .from('driver_requests')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Arrive & Drive Matchmaking</h1>
                    <p className="text-muted-foreground mt-1">
                        Find your next seat or the perfect driver for your team.
                    </p>
                </div>
                <div className="flex gap-4">
                    <Link
                        href="/matchmaking/create/seat"
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                    >
                        List a Seat
                    </Link>
                    <Link
                        href="/matchmaking/create/request"
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                    >
                        Find a Drive
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Available Seats Column */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-semibold">Available Seats</h2>
                        <span className="text-sm text-muted-foreground">{seats?.length || 0} listings</span>
                    </div>

                    <div className="space-y-4">
                        {seats && seats.length > 0 ? (
                            seats.map((seat: any) => (
                                <div key={seat.id} className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-xl font-bold">{seat.title}</h3>
                                        <div className="text-right">
                                            <span className="block font-bold text-lg text-green-600">
                                                {seat.price ? `${seat.currency} ${seat.price}` : 'Inquire'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-sm text-muted-foreground mb-4 space-y-1">
                                        {seat.event_name && <p>🏁 {seat.event_name}</p>}
                                        {seat.track_name && <p>📍 {seat.track_name}</p>}
                                        {seat.event_date && <p>📅 {new Date(seat.event_date).toLocaleDateString()}</p>}
                                        {seat.car_info && (
                                            <p>🚗 {seat.car_info.make} {seat.car_info.model} ({seat.car_info.class})</p>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center mt-4">
                                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                            {seat.status}
                                        </span>
                                        <Link href={`/matchmaking/seat/${seat.id}`} className="text-sm font-medium text-primary hover:underline">
                                            View Details →
                                        </Link>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <EmptyState
                                icon={Armchair}
                                title="No seats listed yet"
                                description="Be the first to list a seat for an upcoming event."
                                actionLabel="List a Seat"
                                actionLink="/matchmaking/create/seat"
                            />
                        )}
                    </div>
                </section>

                {/* Driver Requests Column */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-semibold">Drivers Seeking Seats</h2>
                        <span className="text-sm text-muted-foreground">{requests?.length || 0} requests</span>
                    </div>

                    <div className="space-y-4">
                        {requests && requests.length > 0 ? (
                            requests.map((req: any) => (
                                <div key={req.id} className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 hover:shadow-md transition-shadow">
                                    <h3 className="text-xl font-bold mb-2">{req.title}</h3>
                                    <div className="flex gap-2 mb-3">
                                        {req.experience_level && (
                                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200">
                                                {req.experience_level}
                                            </span>
                                        )}
                                        {req.preferred_region && (
                                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200">
                                                {req.preferred_region}
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                                        {req.bio || 'No bio provided.'}
                                    </p>

                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">
                                            Budget: {req.budget ? `${req.currency} ${req.budget}` : 'Negotiable'}
                                        </span>
                                        <Link href={`/matchmaking/request/${req.id}`} className="text-sm font-medium text-primary hover:underline">
                                            View Profile →
                                        </Link>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <EmptyState
                                icon={UserPlus}
                                title="No active driver requests"
                                description="Looking for a seat? Create a driver request."
                                actionLabel="Create Request"
                                actionLink="/matchmaking/create/request"
                            />
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
