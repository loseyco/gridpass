import Link from 'next/link'
import Image from 'next/image'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { getButtonClasses } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface TeamCardProps {
    team: {
        id: string
        name: string
        slug: string
        logo_url: string | null
        description: string | null
    }
    role?: string
}

export function TeamCard({ team, role }: TeamCardProps) {
    return (
        <Card className="overflow-hidden flex flex-col h-full">
            <div className="aspect-[3/1] bg-muted relative">
                {team.logo_url ? (
                    <Image
                        src={team.logo_url}
                        alt={team.name}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full bg-primary/10 text-primary font-bold text-lg">
                        {team.name}
                    </div>
                )}
            </div>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="line-clamp-1">{team.name}</CardTitle>
                    {role && <Badge variant="secondary" className="capitalize">{role}</Badge>}
                </div>
            </CardHeader>
            <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-2">
                    {team.description || "No description provided."}
                </p>
            </CardContent>
            <CardFooter className="gap-2">
                <Link
                    href={`/team/${team.slug}/dashboard`}
                    className={getButtonClasses('default', 'default', "w-full")}
                >
                    Dashboard
                </Link>
                <Link
                    href={`/team/${team.slug}`}
                    className={getButtonClasses('outline', 'icon')}
                >
                    <span className="sr-only">View Public Page</span>
                    ↗
                </Link>
            </CardFooter>
        </Card>
    )
}
