'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function fetchAllApps() {
    const supabase = await createClient()
    const { data: apps, error } = await supabase
        .from('os_apps')
        .select('*')
        .order('name', { ascending: true })

    if (error) {
        console.error("Error fetching apps:", error)
        return []
    }
    return apps
}

export async function fetchAppBySlug(slug: string) {
    const supabase = await createClient()
    const { data: app, error } = await supabase
        .from('os_apps')
        .select('*')
        .eq('slug', slug)
        .single()

    if (error) return null
    return app
}

export async function createApp(formData: FormData) {
    const supabase = await createClient()
    const name = formData.get('name') as string
    const slug = formData.get('slug') as string

    if (!name || !slug) {
        return { error: 'Name and Slug are required' }
    }

    const { error } = await supabase
        .from('os_apps')
        .insert({
            name,
            slug,
            schema: {
                component: "Container",
                props: { style: { padding: "2rem" } },
                children: [
                    { component: "Container", props: { children: "New App" } }
                ]
            }
        })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/studio')
    redirect(`/studio/${slug}`)
}

export async function saveAppSchema(slug: string, schema: any) {
    const supabase = await createClient()

    // Validate JSON? (Basic check)
    // Validate JSON? (Basic check)
    if (!schema || typeof schema !== 'object') {
        return { error: 'Invalid Schema' }
    }

    const { data, error } = await supabase
        .from('os_apps')
        .update({
            schema,
            updated_at: new Date().toISOString()
        })
        .eq('slug', slug)
        .select()

    if (error) {
        return { error: error.message }
    }

    const count = (data as any[])?.length || 0

    if (count === 0) {
        return { error: 'No rows updated. Check permissions or slug.' }
    }

    revalidatePath(`/studio/${slug}`)
    revalidatePath(`/apps/${slug}`)
    return { success: true }
}
