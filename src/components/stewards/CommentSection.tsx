"use client"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { Loader2, Send } from "lucide-react"

interface Comment {
    id: string
    content: string
    created_at: string
    user_id: string
    profiles: {
        username: string
        avatar_url: string | null
    }
}

export default function CommentSection({ incidentId, initialComments }: { incidentId: string, initialComments: Comment[] }) {
    const [comments, setComments] = useState<Comment[]>(initialComments)
    const [newComment, setNewComment] = useState("")
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newComment.trim()) return

        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            toast.error("Please login to comment")
            setLoading(false)
            return
        }

        const { data, error } = await supabase
            .from('os_stewards_comments')
            .insert({
                incident_id: incidentId,
                user_id: user.id,
                content: newComment
            })
            .select('*, profiles(username, avatar_url)')
            .single()

        if (error) {
            console.error(error)
            toast.error("Failed to post comment")
        } else {
            setComments([data, ...comments])
            setNewComment("")
            toast.success("Comment posted")
        }
        setLoading(false)
    }

    return (
        <div className="mt-8 bg-zinc-900/50 p-6 rounded-lg border border-zinc-800">
            <h3 className="text-lg font-bold text-white mb-4">Steward's Room ({comments.length})</h3>

            <form onSubmit={handleSubmit} className="mb-8 flex gap-4">
                <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Join the discussion... (Explain your verdict)"
                    className="bg-zinc-800 border-zinc-700 min-h-[80px]"
                />
                <Button type="submit" disabled={loading || !newComment.trim()} className="h-auto">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
            </form>

            <div className="space-y-6">
                {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-4">
                        <Avatar className="w-8 h-8">
                            <AvatarImage src={comment.profiles?.avatar_url || ''} />
                            <AvatarFallback>{comment.profiles?.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-bold text-white">{comment.profiles?.username || 'Unknown Driver'}</span>
                                <span className="text-xs text-zinc-500">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                            </div>
                            <p className="text-zinc-300 text-sm whitespace-pre-wrap">{comment.content}</p>
                        </div>
                    </div>
                ))}

                {comments.length === 0 && (
                    <p className="text-zinc-500 text-center py-4">No comments yet. Be the first to give a verdict!</p>
                )}
            </div>
        </div>
    )
}
