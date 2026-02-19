'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { saveMatch } from '@/app/actions/match'
import { toast } from 'sonner'
import { Briefcase } from 'lucide-react'

interface InviteCandidateModalProps {
    isOpen: boolean
    onClose: () => void
    candidateId: string
    candidateName: string
}

export default function InviteCandidateModal({ isOpen, onClose, candidateId, candidateName }: InviteCandidateModalProps) {
    const [jobs, setJobs] = useState<any[]>([])
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [loadingJobs, setLoadingJobs] = useState(true)

    const supabase = createClient()

    useEffect(() => {
        if (isOpen) {
            fetchJobs()
        }
    }, [isOpen])

    const fetchJobs = async () => {
        setLoadingJobs(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            // Fetch jobs created by this user
            const { data: userJobs } = await supabase
                .from('os_jobs')
                .select('id, title, company_name')
                .eq('created_by', user.id)
                .eq('status', 'open') // Only open jobs?

            // Also fetch gigs? 
            // For now just jobs to keep it simple, or maybe union them?

            setJobs(userJobs || [])
        }
        setLoadingJobs(false)
    }

    const handleInvite = async () => {
        if (!selectedJobId) return

        setLoading(true)
        try {
            const result = await saveMatch(candidateId, 'candidate', 'invited', selectedJobId)
            if (result.error) {
                toast.error('Failed to send invite')
            } else {
                toast.success(`Invited ${candidateName} to apply!`)
                onClose()
            }
        } catch (error) {
            toast.error('Something went wrong')
        }
        setLoading(false)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-neutral-900 border border-white/10 text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Invite {candidateName}</DialogTitle>
                    <DialogDescription className="text-neutral-400">
                        Select a job to invite this candidate to apply for.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {loadingJobs ? (
                        <div className="text-center text-neutral-500 py-4">Loading your jobs...</div>
                    ) : jobs.length === 0 ? (
                        <div className="text-center py-6 border border-dashed border-neutral-700 rounded-lg">
                            <Briefcase className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                            <p className="text-neutral-400">You don't have any open jobs.</p>
                            <Button variant="link" className="text-emerald-500" onClick={() => window.location.href = '/post-job'}>
                                Post a Job
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                            {jobs.map(job => (
                                <div
                                    key={job.id}
                                    onClick={() => setSelectedJobId(job.id)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedJobId === job.id
                                            ? 'bg-emerald-500/10 border-emerald-500'
                                            : 'bg-black/40 border-white/10 hover:border-white/30'
                                        }`}
                                >
                                    <h4 className="font-bold text-white">{job.title}</h4>
                                    <p className="text-xs text-neutral-400">{job.company_name}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} className="text-neutral-400 hover:text-white">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleInvite}
                        disabled={!selectedJobId || loading}
                        className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold"
                    >
                        {loading ? 'Sending...' : 'Send Invitation'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
