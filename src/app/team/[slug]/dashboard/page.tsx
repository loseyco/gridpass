import { getTeam } from '@/app/teams/actions'
import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Users, Calendar, Settings, Shield } from 'lucide-react'

export default async function TeamDashboard({ params }: { params: Promise<{ slug: string }> }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { slug } = await params

    if (!user) {
        redirect('/login')
    }

    const team = await getTeam(slug)
    if (!team) notFound()

    // Verify membership
    const { data: membership } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', team.id)
        .eq('user_id', user.id)
        .single()

    if (!membership) {
        // Not a member, redirect to public page or request access
        redirect(`/team/${team.slug}`)
    }

    return (
        <div className="container py-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Team Dashboard</h1>
                    <p className="text-muted-foreground">Manage {team.name}</p>
                </div>
                <div className="flex gap-2">
                    <Link href={`/team/${team.slug}`} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">View Public Page</Link>
                    <Button variant="default">Invite Member</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Members</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{team.members?.[0]?.count || 1}</div>
                        <p className="text-xs text-muted-foreground">Active members</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground">Scheduled races/tests</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Settings</CardTitle>
                        <Settings className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">--</div>
                        <Link href={`/team/${team.slug}/settings`} className="text-xs text-primary hover:underline">Manage Team</Link>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Your Role</CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold capitalize">{membership.role}</div>
                        <p className="text-xs text-muted-foreground">Access Level</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity / Quick Actions could go here */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-6 border rounded-lg bg-card">
                    <h3 className="text-lg font-medium mb-4">Quick Links</h3>
                    <ul className="space-y-2">
                        <li><Link href="#" className="text-primary hover:underline">Manage Roster</Link></li>
                        <li><Link href="#" className="text-primary hover:underline">Schedule Event</Link></li>
                        <li><Link href="#" className="text-primary hover:underline">Update Team Profile</Link></li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
