import { Metadata } from 'next'
import TaskAppClient from './TaskAppClient'

export const metadata: Metadata = {
    title: 'Tasks | GridPass',
    description: 'Manage your tasks and projects.',
    openGraph: {
        images: ['/hero-launch.png'],
    },
}

export default function TaskPage() {
    return <TaskAppClient />
}
