import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export function CreateEventButton({ variant = "default" }: { variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive" }) {
    return (
        <Link href="/social/new">
            <Button variant={variant}>
                <Plus className="mr-2 h-4 w-4" />
                Create Event
            </Button>
        </Link>
    )
}
