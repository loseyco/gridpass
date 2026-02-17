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
    reddit_post_id?: string | null
    thumbnail?: string | null // Added field
    votes?: {
        driver_a: number
        driver_b: number
        racing_incident: number
    }
    user_vote?: string | null
}

export default function IncidentCard({ incident }: { incident: Incident }) {
    // ... code ...

    // Helper to determine embed type/url
    function getEmbed(url: string, redditPostId?: string | null) {
        if (!url) return { type: 'link', src: '' }

        // YouTube
        if (url.includes('youtu')) {
            const id = getYouTubeId(url)
            return id ? { type: 'youtube', src: `https://www.youtube.com/embed/${id}` } : { type: 'link', src: url }
        }

        // Streamable
        if (url.includes('streamable.com')) {
            const code = url.split('/').pop()
            return { type: 'streamable', src: `https://streamable.com/e/${code}` }
        }

        // Reddit (Post or Video)
        if (url.includes('reddit.com')) {
            const cleanUrl = url.replace(/\/$/, '')
            return { type: 'reddit', src: `${cleanUrl}?embed=true&theme=dark` }
        }

        // Reddit Fallback (v.redd.it) -> Use Post ID if available
        if (url.includes('v.redd.it') && redditPostId) {
            return { type: 'reddit', src: `https://www.reddit.com/comments/${redditPostId}?embed=true&theme=dark` }
        }

        // Direct Video
        if (url.match(/\.(mp4|webm|ogg)$/)) {
            return { type: 'video', src: url }
        }

        // Fallback
        return { type: 'link', src: url }
    }

    // ... rest of file
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

    const handleShare = async () => {
        const url = `${window.location.origin}/sim-racing/stewards/${incident.id}`

        const shareData = {
            title: incident.title,
            text: `Who is at fault? Check out this incident on GridPass Stewards.`,
            url: url
        }

        if (navigator.share) {
            try {
                await navigator.share(shareData)
            } catch (err: any) {
                // Ignore AbortError (user cancelled share), show error for others
                if (err.name !== 'AbortError') {
                    console.error('Error sharing:', err)
                    // Fallback to clipboard if share fails for non-cancellation reasons
                    navigator.clipboard.writeText(url)
                    toast.success("Link copied to clipboard!")
                }
            }
        } else {
            // Fallback for browsers without Web Share API
            navigator.clipboard.writeText(url)
            toast.success("Link copied to clipboard!")
        }
    }

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
                        <CardTitle className="text-xl text-white">
                            <Link href={`/sim-racing/stewards/${incident.id}`} className="hover:underline">
                                {incident.title}
                            </Link>
                        </CardTitle>
                    </div>
                    <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white" onClick={handleShare}>
                        <Share2 className="w-4 h-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {/* Video Embed */}
                <div className="relative aspect-video bg-black rounded-md overflow-hidden mb-4">
                    const {type, src} = getEmbed(incident.video_url, incident.reddit_post_id)

                    switch (type) {
                            case 'youtube':
                    case 'streamable':
                    return (
                    <iframe
                        src={src}
                        className="absolute inset-0 w-full h-full"
                        allowFullScreen
                        allow="autoplay; encrypted-media"
                    />
                    )
                    case 'video':
                    return (
                    <video
                        src={src}
                        controls
                        className="absolute inset-0 w-full h-full"
                    />
                    )
                    default:
                    // Fallback: Thumbnail or Generic Link
                    if (incident.thumbnail) {
                                    return (
                    <div className="group relative w-full h-full">
                        <img
                            src={incident.thumbnail}
                            alt="Incident Thumbnail"
                            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity"
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <a
                                href={incident.video_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-transform transform group-hover:scale-105"
                            >
                                <Share2 className="w-5 h-5" /> Watch on External Site
                            </a>
                            <p className="mt-2 text-sm text-zinc-300 font-medium bg-black/50 px-2 py-1 rounded">
                                Video not embeddable
                            </p>
                        </div>
                    </div>
                    )
                                }

                    return (
                    <div className="flex items-center justify-center h-full text-zinc-500 bg-zinc-900">
                        <a href={incident.video_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white px-4 py-2 border border-zinc-700 rounded-md bg-black/50 hover:bg-zinc-800 transition-colors">
                            Video Link <Share2 className="w-4 h-4" />
                        </a>
                    </div>
                    )
                        }
                    })()}
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

// Helper to determine embed type/url
function getEmbed(url: string, redditPostId?: string | null) {
    if (!url) return { type: 'link', src: '' }

    // YouTube
    if (url.includes('youtu')) {
        const id = getYouTubeId(url)
        return id ? { type: 'youtube', src: `https://www.youtube.com/embed/${id}` } : { type: 'link', src: url }
    }

    // Streamable
    if (url.includes('streamable.com')) {
        // Extract code: streamable.com/abcd -> streamable.com/e/abcd
        const code = url.split('/').pop()
        return { type: 'streamable', src: `https://streamable.com/e/${code}` }
    }

    // Reddit (Post or Video)
    if (url.includes('reddit.com')) {
        // Determine if it's a post path. If so, append embed=true
        // Remove trailing slash if present then append
        const cleanUrl = url.replace(/\/$/, '')
        return { type: 'reddit', src: `${cleanUrl}?embed=true&theme=dark` }
    }

    // Reddit Fallback (v.redd.it) -> Use Post ID if available
    if (url.includes('v.redd.it') && redditPostId) {
        return { type: 'reddit', src: `https://www.reddit.com/comments/${redditPostId}?embed=true&theme=dark` }
    }

    // Direct Video
    if (url.match(/\.(mp4|webm|ogg)$/)) {
        return { type: 'video', src: url }
    }

    // Fallback
    return { type: 'link', src: url }
}

function getYouTubeId(url: string) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}
