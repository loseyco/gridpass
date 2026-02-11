'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createTeam } from '@/actions/teams'
import { useRouter } from 'next/navigation'

import VideoGuide from '@/components/VideoGuide';
import FeatureStatusBadge from '@/components/FeatureStatusBadge';
import { useTour } from '@/hooks/useTour';

export function CreateTeamForm() {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { startTour } = useTour();

    const startTeamTour = () => {
        startTour([
            { popover: { title: 'Create Your Team', description: 'Establish your team\'s presence on GridPass with a public profile.' } },
            { element: '#team-name-input', popover: { title: 'Team Name', description: 'Enter the official name of your racing team or organization.' } },
            { element: '#team-slug-input', popover: { title: 'Custom URL', description: 'Choose a unique URL for your team page (e.g. gridpass.app/team/your-team).' } },
            { element: '#team-description-input', popover: { title: 'About Your Team', description: 'Write a brief description about your team\'s history, goals, or series participation.' } },
        ]);
    };

    async function handleSubmit(formData: FormData) {
        setError(null);
        setLoading(true);
        try {
            await createTeam(formData);
        } catch (e: any) {
            if (e.message && e.message.includes('NEXT_REDIRECT')) {
                throw e;
            }
            setError(e.message || 'An error occurred');
            setLoading(false);
        }
    }

    return (
        <div className="max-w-md w-full mx-auto p-6 bg-card rounded-lg border shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold">Create a New Team</h2>
                    <FeatureStatusBadge status="alpha" />
                </div>
                <div className="flex items-center gap-2">
                    <VideoGuide title="Team Creation Guide" videoSrc="/guides/team-creation.webp" />
                    <button onClick={startTeamTour} className="text-xs font-bold text-muted-foreground hover:text-foreground border px-2 py-1 rounded-full transition-colors">
                        Tour
                    </button>
                </div>
            </div>
            <form action={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Team Name</Label>
                    <div id="team-name-input">
                        <Input
                            id="name"
                            name="name"
                            placeholder="e.g. Red Bull Racing"
                            required
                            onChange={(e) => {
                                // Auto-slugify
                                const slugInput = document.getElementById('slug') as HTMLInputElement;
                                if (slugInput && !slugInput.value) {
                                    slugInput.value = e.target.value
                                        .toLowerCase()
                                        .replace(/ /g, '-')
                                        .replace(/[^\w-]+/g, '');
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="slug">URL Slug</Label>
                    <div id="team-slug-input" className="flex items-center space-x-2">
                        <span className="text-muted-foreground text-sm">gridpass.app/team/</span>
                        <Input
                            id="slug"
                            name="slug"
                            placeholder="red-bull-racing"
                            required
                            pattern="[a-z0-9-]+"
                            title="Lowercase letters, numbers, and hyphens only"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <div id="team-description-input">
                        <Textarea
                            id="description"
                            name="description"
                            placeholder="Tell us about your team..."
                        />
                    </div>
                </div>

                {error && (
                    <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                        {error}
                    </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Team'}
                </Button>
            </form>
        </div>
    )
}
