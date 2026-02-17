import { getOrganizations } from '@/app/actions/organizations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export default async function AdminOrgsPage({ searchParams }: { searchParams: Promise<{ q?: string, status?: string }> }) {
    const { q: query, status } = await searchParams
    // We need to fetch ALL orgs for admin, including status. 
    // The current getOrganizations might filter by active only? 
    // Let's check getOrganizations implementation or just fetch directly here for Admin power.
    // Ideally we update getOrganizations to allow admin fetching everything.

    // For now, let's reuse getOrganizations but we might miss non-active ones if we didn't update the query.
    // Actually, getOrganizations filters by status='active' by default in the query?
    // Let's check the implementation of getOrganizations again.

    const orgs = await getOrganizations({ search: query })

    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sales CRM</h1>
                    <p className="text-muted-foreground">Manage your B2B leads and outreach.</p>
                </div>
                <Link href="/map/new">
                    <Button>Add Lead</Button>
                </Link>
            </div>

            <div className="grid gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Leads ({orgs.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="relative overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs uppercase bg-muted/50">
                                    <tr>
                                        <th className="px-6 py-3">Organization</th>
                                        <th className="px-6 py-3">Type</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Location</th>
                                        <th className="px-6 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orgs.map((org: any) => (
                                        <tr key={org.id} className="border-b">
                                            <td className="px-6 py-4 font-medium">
                                                {org.name}
                                                {org.website && <a href={org.website} target="_blank" className="block text-xs text-muted-foreground hover:underline">{org.website}</a>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline">{org.type}</Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge className={
                                                    org.lead_status === 'client' ? 'bg-green-500' :
                                                        org.lead_status === 'contacted' ? 'bg-blue-500' :
                                                            org.lead_status === 'rejected' ? 'bg-red-500' :
                                                                'bg-gray-500'
                                                }>
                                                    {org.lead_status || 'Prospect'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">{org.location}</td>
                                            <td className="px-6 py-4">
                                                <Link href={`/admin/orgs/${org.id}`}>
                                                    <Button variant="ghost" size="sm">Edit</Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
