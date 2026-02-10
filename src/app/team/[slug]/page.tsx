import { getTeam } from '@/app/teams/actions'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const team = await getTeam(slug)
    if (!team) return { title: 'Team Not Found' }
    return {
        title: `${team.name} | GridPass`,
        description: team.description || `Official page for ${team.name} on GridPass.`,
    }
}

export default async function TeamPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const team = await getTeam(slug)

    if (!team) {
        notFound()
    }

    return (
        <div className="container py-10">
            <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Sidebar / Left Column */}
                <div className="w-full md:w-1/3 space-y-6">
                    <div className="aspect-square relative rounded-lg overflow-hidden bg-muted border">
                        {team.logo_url ? (
                            <Image
                                src={team.logo_url}
                                alt={team.name}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-4xl font-bold bg-primary/10 text-primary">
                                {team.name.charAt(0)}
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-3xl font-bold tracking-tight">{team.name}</h1>
                        <p className="text-muted-foreground">{team.description}</p>

                        <div className="flex flex-col gap-2">
                            <Link href={`/team/${team.slug}/contact`} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full">Contact Team</Link>
                            {/* Future: Follow, Join Request */}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="w-full md:w-2/3 space-y-8">
                    <section>
                        <h2 className="text-2xl font-semibold mb-4">About</h2>
                        <div className="prose dark:prose-invert max-w-none">
                            <p>{team.description || "No description provided."}</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">Team Roster</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Todo: Iterate over public members */}
                            <div className="p-4 border rounded-lg bg-card text-card-foreground">
                                <p className="font-medium">Member List Coming Soon</p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}
