import { createClient } from '@/utils/supabase/server'
import IncidentCard from '@/components/stewards/IncidentCard'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { PlusCircle } from 'lucide-react'

export default async function StewardsPage() {
    const supabase = await createClient()

    // Fetch incidents
    const { data: incidents, error } = await supabase
        .from('os_stewards_incidents')
        .select(`
            *,
            votes:os_stewards_votes(vote_type)
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Error fetching incidents:", error)
    }

    // Process votes for UI
    const processedIncidents = incidents?.map(incident => {
        const voteCounts = { driver_a: 0, driver_b: 0, racing_incident: 0 }

        incident.votes.forEach((v: any) => {
            if (v.vote_type in voteCounts) {
                //@ts-ignore
                voteCounts[v.vote_type]++
            }
        })

        return {
            ...incident,
            votes: voteCounts
        }
    }) || []

    return (
        <div className="min-h-screen bg-black pt-20 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-black italic tracking-tighter text-white">
                            SIM <span className="text-red-500">STEWARDS</span>
                        </h1>
                        <p className="text-zinc-400">Who's at fault? You decide.</p>
                    </div>
                    <Link href="/sim-racing/stewards/submit">
                        <Button className="bg-red-600 hover:bg-red-700 text-white">
                            <PlusCircle className="w-4 h-4 mr-2" /> Submit Incident
                        </Button>
                    </Link>
                </div>

                {processedIncidents.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-zinc-800 rounded-lg">
                        <h3 className="text-xl text-zinc-500 font-bold mb-2">No Incidents Under Review</h3>
                        <p className="text-zinc-600 mb-6">Be the first to submit a clip for review!</p>
                        <Link href="/sim-racing/stewards/submit">
                            <Button variant="outline">Submit Clip</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {processedIncidents.map(incident => (
                            <IncidentCard key={incident.id} incident={incident} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
