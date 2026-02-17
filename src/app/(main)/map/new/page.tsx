'use client'

import { createOrganization } from '@/app/actions/organizations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

export default function NewOrgPage() {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const handleSubmit = (formData: FormData) => {
        startTransition(async () => {
            try {
                const result = await createOrganization(formData)
                toast.success('Business added!')
                if (result && result.orgId) {
                    router.push(`/manage/${result.orgId}`)
                } else {
                    router.push('/map')
                }
            } catch (error) {
                toast.error('Failed to add business. Check logs.')
            }
        })
    }

    return (
        <div className="container mx-auto max-w-2xl py-8">
            <h1 className="text-3xl font-bold mb-6">Add a Business</h1>

            <form action={handleSubmit} className="space-y-6 border p-6 rounded-lg bg-card">
                <div className="space-y-2">
                    <Label htmlFor="name">Business Name</Label>
                    <Input id="name" name="name" required placeholder="Joe's Race Shop" />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <select
                        id="type"
                        name="type"
                        required
                        defaultValue="shop"
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <option value="shop">Shop / Garage</option>
                        <option value="team">Race Team</option>
                        <option value="club">Club / Organization</option>
                        <option value="track">Track / Venue</option>
                        <option value="service">Service Provider</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" name="location" placeholder="City, State (e.g. Austin, TX)" />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="website">Website (Optional)</Label>
                    <Input id="website" name="website" type="url" placeholder="https://..." />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        name="description"
                        placeholder="Briefly describe what you do..."
                        className="min-h-[100px]"
                    />
                </div>

                <div className="flex justify-end gap-4">
                    <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit" disabled={isPending}>
                        {isPending ? 'Saving...' : 'Add Business'}
                    </Button>
                </div>
            </form>
        </div>
    )
}
