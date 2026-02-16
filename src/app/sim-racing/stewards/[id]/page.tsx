import { createClient } from '@/utils/supabase/server'
import IncidentCard from '@/components/stewards/IncidentCard'
import CommentSection from '@/components/stewards/CommentSection'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'

export default async function IncidentPage({ params }: { params: { id: string } }) {
    const supabase = await createClient()

    // Fetch incident with votes and comments
    const { data: incident, error } = await supabase
        .from('os_stewards_incidents')
        .select(`
            *,
            votes:os_stewards_votes(vote_type),
            comments:os_stewards_comments(
                *,
                profiles(username, avatar_url)
            )
        `)
        .eq('id', params.id)
        .single()

    if (error || !incident) {
        notFound()
    }

    // Process votes
    const voteCounts = { driver_a: 0, driver_b: 0, racing_incident: 0 }
    incident.votes.forEach((v: any) => {
        if (v.vote_type in voteCounts) {
            //@ts-ignore
            voteCounts[v.vote_type]++
        }
    })

    const processedIncident = { ...incident, votes: voteCounts }

    // Sort comments newest first
    const sortedComments = incident.comments.sort((a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    return (
        <div className="min-h-screen bg-black pt-20 px-4">
            <div className="max-w-3xl mx-auto">
                <Link href="/sim-racing/stewards" className="flex items-center text-zinc-500 hover:text-white mb-6">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Feed
                </Link>

                <IncidentCard incident={processedIncident} />

                <CommentSection incidentId={incident.id} initialComments={sortedComments} />
            </div>
        </div>
    )
}
