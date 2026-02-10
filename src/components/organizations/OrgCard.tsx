'use client'

import { Organization, claimOrganization } from '@/app/actions/organizations'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Globe, CheckCircle } from 'lucide-react'
import { useTransition } from 'react'
import { toast } from 'sonner'

export function OrgCard({ org }: { org: Organization }) {
    const [isPending, startTransition] = useTransition()

    const handleClaim = () => {
        startTransition(async () => {
            try {
                await claimOrganization(org.id)
                toast.success('Claim request sent!')
            } catch (error) {
                toast.error('Failed to claim. Are you logged in?')
            }
        })
    }

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex flex-col space-y-1">
                    <CardTitle className="text-xl font-bold">{org.name}</CardTitle>
                    <Badge variant="outline" className="w-fit">
                        {org.type.toUpperCase()}
                    </Badge>
                </div>
                {org.status === 'verified' && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                )}
            </CardHeader>
            <CardContent>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                    {org.description || 'No description available.'}
                </p>
                <div className="space-y-2 text-sm">
                    {org.location && (
                        <div className="flex items-center text-gray-600">
                            <MapPin className="mr-2 h-4 w-4" />
                            {org.location}
                        </div>
                    )}
                    {org.website && (
                        <div className="flex items-center text-gray-600">
                            <Globe className="mr-2 h-4 w-4" />
                            <a href={org.website} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600">
                                Website
                            </a>
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter>
                {!org.claimed_by ? (
                    <Button
                        className="w-full"
                        variant="secondary"
                        onClick={handleClaim}
                        disabled={isPending}
                    >
                        {isPending ? 'Claiming...' : 'Claim This Business'}
                    </Button>
                ) : (
                    <Button className="w-full" variant="ghost" disabled>
                        {org.status === 'pending_claim' ? 'Claim Pending' : 'Managed'}
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}
