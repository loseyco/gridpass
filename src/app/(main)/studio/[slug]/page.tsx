import { fetchAppBySlug } from '@/os/actions/studio-actions'
import { fetchOSData } from '@/os/actions/grid-actions'
import { notFound } from 'next/navigation'
import { VisualEditorRoot } from '@/os/studio/VisualEditorRoot'

interface PageProps {
    params: Promise<{ slug: string }>
}

export default async function StudioEditorPage({ params }: PageProps) {
    const { slug } = await params
    const app = await fetchAppBySlug(slug)
    const osData = await fetchOSData()

    if (!app) {
        notFound()
    }

    return <VisualEditorRoot app={app} initialSchema={app.schema} osData={osData} />
}
