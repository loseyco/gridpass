import { createClient } from '@/utils/supabase/server'
import IncidentCard from '@/components/stewards/IncidentCard'
import CommentSection from '@/components/stewards/CommentSection'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'

// ... imports unchanged

// ... imports unchanged

// Explicit interfaces to avoid dependency on outdated Database types
interface Vote {
    vote_type: string
}

interface Comment {
    id: string
    user_id: string
    created_at: string
    content: string
    profiles: {
        username: string | null
        avatar_url: string | null
    }
}

interface Incident {
    id: string
    created_at: string
    title: string
    description: string | null
    video_url: string
    sim_title: string | null
    user_id: string | null
    votes: any[]
    comments: any[]
}

export default async function IncidentPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params

    // Fetch incident with votes and comments (raw)
    const { data: incident, error } = await supabase
        .from('os_stewards_incidents')
        .select(`
            *,
            votes:os_stewards_votes(vote_type),
            comments:os_stewards_comments(
                *
            )
        `)
        .eq('id', id)
        .single()

    if (error || !incident) {
        notFound()
    }

    // Manual join for profiles
    let commentsWithProfiles: Comment[] = []
    if (incident.comments) {
        // @ts-ignore - Supabase types for joined arrays can be tricky
        const rawComments = incident.comments as any[]

        if (rawComments.length > 0) {
            const userIds = Array.from(new Set(rawComments.map(c => c.user_id)))
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, username, avatar_url')
                .in('id', userIds)

            const profileMap = new Map(profiles?.map(p => [p.id, p]))

            commentsWithProfiles = rawComments.map(c => ({
                ...c,
                profiles: profileMap.get(c.user_id) || { username: 'Unknown Driver', avatar_url: null }
            }))
        }
    }

    // Process votes
    const voteCounts: Record<string, number> = { driver_a: 0, driver_b: 0, racing_incident: 0 }
    // @ts-ignore
    incident.votes.forEach((v: any) => {
        if (v.vote_type in voteCounts) {
            voteCounts[v.vote_type]++
        }
    })

    const processedIncident = { ...incident, votes: voteCounts }

    // Sort comments newest first
    const sortedComments = commentsWithProfiles.sort((a, b) =>
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
