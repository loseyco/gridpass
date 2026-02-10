'use client'

import { createTeam } from '@/app/teams/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner' // Assuming sonner or similar toast is available, or use alert

export function CreateTeamForm() {
    const [isLoading, setIsLoading] = useState(false)

    async function onSubmit(formData: FormData) {
        setIsLoading(true)
        try {
            await createTeam(formData)
            toast.success('Team created successfully!')
        } catch (error: any) {
            toast.error(error.message || 'Something went wrong')
            setIsLoading(false)
        }
    }

    return (
        <form action={onSubmit} className="space-y-6 max-w-lg mx-auto p-6 border rounded-lg shadow-sm bg-card">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">Create a New Team</h2>
                <p className="text-muted-foreground">Start your racing organization on GridPass.</p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="name">Team Name</Label>
                <Input id="name" name="name" placeholder="e.g. Red Bull Racing" required />
            </div>

            <div className="space-y-2">
                <Label htmlFor="slug">Team Handle (Slug)</Label>
                <div className="flex items-center space-x-2">
                    <span className="text-muted-foreground text-sm">gridpass.app/team/</span>
                    <Input id="slug" name="slug" placeholder="red-bull-racing" required />
                </div>
                <p className="text-xs text-muted-foreground">This will be your public URL.</p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="Tell us about your team..." />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Team'}
            </Button>
        </form>
    )
}
