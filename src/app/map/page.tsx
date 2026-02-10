import { getOrganizations } from '@/app/actions/organizations'
import { OrgCard } from '@/components/organizations/OrgCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PlusCircle, Search } from 'lucide-react'
import Link from 'next/link'

export default async function MapPage({ searchParams }: { searchParams: Promise<{ q?: string, type?: string }> }) {
    const { q: query, type } = await searchParams

    const orgs = await getOrganizations({ search: query, type })

    return (
        <div className="container mx-auto py-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">The GridPass Map</h1>
                    <p className="text-muted-foreground mt-2">
                        Find race shops, teams, and tracks. Claim your business to get started.
                    </p>
                </div>

                <div className="flex gap-2">
                    {/* Future: Filter Dropdown */}
                    <Link href="/map/new">
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Business
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <form action="/map" method="GET">
                        <Input
                            name="q"
                            placeholder="Search by name..."
                            className="pl-8"
                            defaultValue={query}
                        />
                    </form>
                </div>
                <div className="flex gap-2">
                    {['all', 'shop', 'team', 'service'].map((t) => (
                        <Link key={t} href={`/map?type=${t === 'all' ? '' : t}`}>
                            <Button variant={type === t || (!type && t === 'all') ? "default" : "outline"} size="sm">
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </Button>
                        </Link>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orgs.length > 0 ? (
                    orgs.map((org) => (
                        <OrgCard key={org.id} org={org} />
                    ))
                ) : (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        No businesses found. Be the first to add one!
                    </div>
                )}
            </div>
        </div>
    )
}
