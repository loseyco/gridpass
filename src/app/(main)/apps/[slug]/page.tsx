import React from 'react'
import AppClient from './AppClient'
import { fetchOSData, fetchMultiEntityData } from '@/os/actions/grid-actions'
import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'

export default async function AppParamsPage({ params, searchParams }: { params: Promise<{ slug: string }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const { slug } = await params;
    const rawSearchParams = await searchParams;

    const supabase = await createClient()

    // 1. Fetch App Schema from Registry
    const { data: app, error } = await supabase
        .from('os_apps')
        .select('*')
        .eq('slug', slug)
        .single()

    if (error || !app) {
        console.error(`App not found: ${slug}`, error)
        notFound()
    }

    const schema = app.schema
    let initialData: Record<string, any> = {}
    let sourceMapping: Record<string, string> | undefined
    let targetUserId: string | undefined

    // 2. Check if schema has dataSources configuration
    if (schema.dataSources && Array.isArray(schema.dataSources)) {
        // Multi-entity mode
        console.log('[AppParamsPage] Multi-entity mode with dataSources:', schema.dataSources)

        // Convert searchParams to simple object
        const params: Record<string, string | undefined> = {}
        for (const [key, value] of Object.entries(rawSearchParams)) {
            params[key] = typeof value === 'string' ? value : undefined
        }

        // Fetch multi-entity data
        initialData = await fetchMultiEntityData(schema.dataSources, params)

        // Build source mapping (dataSource key -> table name)
        sourceMapping = {}
        for (const source of schema.dataSources) {
            sourceMapping[source.key] = source.table
        }

        console.log('[AppParamsPage] Fetched multi-entity data:', Object.keys(initialData))
        console.log('[AppParamsPage] Source mapping:', sourceMapping)
    } else {
        // Legacy mode: user-only data
        console.log('[AppParamsPage] Legacy user-only mode')

        const { uid, id } = rawSearchParams
        targetUserId = (typeof uid === 'string' ? uid : undefined) || (typeof id === 'string' ? id : undefined)

        // Resolve Username to UUID if needed
        if (targetUserId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUserId)) {
            const { data: profile } = await supabase
                .from('os_user_profiles')
                .select('id')
                .eq('username', targetUserId)
                .single()

            if (profile) {
                targetUserId = profile.id
            } else {
                console.error(`User param '${targetUserId}' not found (assumed username)`)
            }
        }

        // Fetch user data if targetUserId provided, otherwise empty (creation mode)
        if (targetUserId) {
            const osData = await fetchOSData(targetUserId)
            initialData = osData || {}
        } else {
            // Creation mode: empty data
            initialData = {}
        }
    }

    return (
        <AppClient
            slug={slug}
            schema={schema}
            name={app.name}
            initialData={initialData}
            targetUserId={targetUserId}
            sourceMapping={sourceMapping}
        />
    )
}
