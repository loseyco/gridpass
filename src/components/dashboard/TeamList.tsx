import { getMyTeams } from '@/app/teams/actions'
import { TeamCard } from '@/components/teams/TeamCard'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export async function TeamList() {
    const teams = await getMyTeams() as any[] // Quick fix for type inference, strictly we should define the type

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">My Teams</h2>
                <Link
                    href="/teams/create"
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Team
                </Link>
            </div>

            {!teams || teams.length === 0 ? (
                <div className="border border-dashed rounded-lg p-8 text-center bg-muted/50">
                    <p className="text-muted-foreground mb-4">You haven't joined any teams yet.</p>
                    <Link
                        href="/teams/create"
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                    >
                        Start a Team
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {teams.map((team) => (
                        <div key={team.id} className="h-full">
                            <TeamCard team={team} role="Member" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
