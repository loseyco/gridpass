import { CreateTeamForm } from '@/components/teams/CreateTeamForm'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Create Team | GridPass',
    description: 'Start your racing team on GridPass',
}

export default function CreateTeamPage() {
    return (
        <div className="container py-10">
            <CreateTeamForm />
        </div>
    )
}
