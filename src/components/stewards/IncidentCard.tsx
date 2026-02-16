"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Share2, AlertTriangle, Car, Gavel } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface Incident {
    id: string
    title: string
    description: string
    video_url: string
    sim_title: string | null
    created_at: string
    votes?: {
        driver_a: number
        driver_b: number
        racing_incident: number
    }
    user_vote?: string | null
}

export default function IncidentCard({ incident }: { incident: Incident }) {
    const [votes, setVotes] = useState(incident.votes || { driver_a: 0, driver_b: 0, racing_incident: 0 })
    const [userVote, setUserVote] = useState<string | null>(incident.user_vote || null)
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    // Simple fingerprinting (User Agent + Screen Res) - mostly rely on IP from server side, 
    // but we construct a simple client ID here for the DB record if needed, 
    // though the real ip_address check happens on the server/edge if we used an API.
    // For direct DB insert from client (RLS), we can't easily get IP.
    // So distinct_id = local storage ID.

    useEffect(() => {
        // Load local vote state if anonymous
        const localVote = localStorage.getItem(`vote_${incident.id}`)
        if (localVote && !userVote) {
            setUserVote(localVote)
        }
    }, [incident.id, userVote])

    const handleVote = async (type: 'driver_a' | 'driver_b' | 'racing_incident') => {
        if (loading) return
        if (userVote) {
            toast.error("You have already voted on this incident.")
            return
        }

        setLoading(true)

        // Get anonymous ID
        let anonId = localStorage.getItem('stewards_anon_id')
        if (!anonId) {
            anonId = Math.random().toString(36).substring(2) + Date.now().toString(36)
            localStorage.setItem('stewards_anon_id', anonId)
        }

        // Optimistic update
        setVotes(prev => ({ ...prev, [type]: prev[type] + 1 }))
        setUserVote(type)
        localStorage.setItem(`vote_${incident.id}`, type)

        const { data: { user } } = await supabase.auth.getUser()

        const { error } = await supabase
            .from('os_stewards_votes')
            .insert({
                incident_id: incident.id,
                user_id: user?.id || null,
                vote_type: type,
                fingerprint: user ? null : anonId // Only use fingerprint if anon
            })

        if (error) {
            console.error(error)
            toast.error("Failed to submit vote. Please try again.")
            // Revert optimistic update
            setVotes(prev => ({ ...prev, [type]: prev[type] - 1 }))
            setUserVote(null)
            localStorage.removeItem(`vote_${incident.id}`)
        } else {
            toast.success("Vote submitted!")
        }

        setLoading(false)
    }

    const totalVotes = votes.driver_a + votes.driver_b + votes.racing_incident
    const getPercent = (count: number) => totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100)

    return (
        <Card className="w-full max-w-2xl mx-auto mb-8 bg-zinc-900 border-zinc-800">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        {incident.sim_title && (
                            <Badge variant="outline" className="mb-2 border-zinc-700 text-zinc-400">
                                {incident.sim_title}
                            </Badge>
                        )}
                        <CardTitle className="text-xl text-white">{incident.title}</CardTitle>
                    </div>
                    <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                        <Share2 className="w-4 h-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {/* Video Embed */}
                <div className="relative aspect-video bg-black rounded-md overflow-hidden mb-4">
                    {/* Handling YouTube Embeds mostly */}
                    {incident.video_url.includes('youtu') ? (
                        <iframe
                            src={`https://www.youtube.com/embed/${getYouTubeId(incident.video_url)}`}
                            className="absolute inset-0 w-full h-full"
                            allowFullScreen
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-zinc-500">
                            <a href={incident.video_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white">
                                Video Link <Share2 className="w-4 h-4" />
                            </a>
                        </div>
                    )}
                </div>

                <p className="text-zinc-400 text-sm mb-6">{incident.description}</p>

                {/* Voting Actions */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                    <VoteButton
                        label="Driver A"
                        color="bg-red-900/50 hover:bg-red-900 text-red-200"
                        count={votes.driver_a}
                        percent={getPercent(votes.driver_a)}
                        selected={userVote === 'driver_a'}
                        onClick={() => handleVote('driver_a')}
                        icon={<Car className="w-4 h-4 mr-2" />}
                    />
                    <VoteButton
                        label="Driver B"
                        color="bg-blue-900/50 hover:bg-blue-900 text-blue-200"
                        count={votes.driver_b}
                        percent={getPercent(votes.driver_b)}
                        selected={userVote === 'driver_b'}
                        onClick={() => handleVote('driver_b')}
                        icon={<Car className="w-4 h-4 mr-2" />}
                    />
                    <VoteButton
                        label="Racing Incident"
                        color="bg-green-900/50 hover:bg-green-900 text-green-200"
                        count={votes.racing_incident}
                        percent={getPercent(votes.racing_incident)}
                        selected={userVote === 'racing_incident'}
                        onClick={() => handleVote('racing_incident')}
                        icon={<Gavel className="w-4 h-4 mr-2" />}
                    />
                </div>
            </CardContent>
            <CardFooter className="border-t border-zinc-800 pt-4 flex justify-between">
                <Link href={`/sim-racing/stewards/${incident.id}`} className="text-sm text-zinc-500 hover:text-zinc-300 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Discuss
                </Link>
                <div className="text-xs text-zinc-600">
                    {totalVotes} votes
                </div>
            </CardFooter>
        </Card>
    )
}

function VoteButton({ label, color, count, percent, selected, onClick, icon }: any) {
    return (
        <button
            onClick={onClick}
            className={`
                relative flex flex-col items-center justify-center p-3 rounded-lg border transition-all
                ${selected ? 'border-white bg-opacity-80 ring-2 ring-white/20' : 'border-transparent'}
                ${color}
            `}
        >
            <div className="flex items-center mb-1 font-bold">
                {icon} {label}
            </div>
            {selected && <Badge variant="secondary" className="mb-1 text-[10px] h-4">VOTED</Badge>}
            <div className="text-xs opacity-80">{percent}% ({count})</div>

            {/* Progress bar background essentially */}
            <div
                className="absolute bottom-0 left-0 h-1 bg-white/20 rounded-b-lg transition-all duration-500"
                style={{ width: `${percent}%` }}
            />
        </button>
    )
}

function getYouTubeId(url: string) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}
