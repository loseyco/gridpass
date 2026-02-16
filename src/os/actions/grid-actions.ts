'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Fetches all OS data for a given user (or the authenticated user if not provided).
 * Aggregates data from profiles, work_history, logistics, etc. into a single object.
 */
export async function fetchOSData(userId?: string) {
    const supabase = await createClient()

    // If no userId provided, get current session
    let targetUserId = userId
    if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null // Or throw error
        targetUserId = user.id
    }

    // Fetch all related data in parallel
    const [
        { data: profile },
        { data: logistics },
        { data: workHistory },
        { data: skills },
        { data: certs },
        { data: memberships }
    ] = await Promise.all([
        supabase.from('os_user_profiles').select('*').eq('id', targetUserId).single(),
        supabase.from('os_user_logistics').select('*').eq('user_id', targetUserId).single(),
        supabase.from('os_user_work_history').select('*').eq('user_id', targetUserId).order('start_date', { ascending: false }),
        supabase.from('os_user_skills').select('*').eq('user_id', targetUserId),
        supabase.from('os_user_certs').select('*').eq('user_id', targetUserId),
        supabase.from('os_user_memberships').select('*').eq('user_id', targetUserId)
    ])

    // Aggregate into a single context object
    // keys match the table names for easy binding resolution
    return {
        os_user_profiles: profile || {},
        os_user_logistics: logistics || {},
        os_user_work_history: workHistory || [],
        os_user_skills: skills || [],
        os_user_certs: certs || [],
        os_user_memberships: memberships || []
    }
}

/**
 * Fetches a specific entity by table and ID or other field.
 * Returns { [tableName]: record }
 */
export async function fetchEntityData(
    tableName: string,
    value: string,
    fetchBy: string = 'id'
) {
    const supabase = await createClient()

    if (!tableName.startsWith('os_')) {
        return { error: 'Invalid table access' }
    }

    const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq(fetchBy, value)
        .single()

    if (error) {
        console.error(`Error fetching ${tableName} by ${fetchBy}=${value}:`, error)
        return null
    }

    return { [tableName]: data }
}

/**
 * Fetches data for multiple entities based on dataSources configuration.
 * Returns object keyed by dataSource key (e.g., { user: {...}, car: {...} })
 */
export async function fetchMultiEntityData(
    dataSources: Array<{
        key: string
        table: string
        fetchBy: string
        param: string
    }>,
    searchParams: Record<string, string | undefined>
) {
    const result: Record<string, any> = {}

    for (const source of dataSources) {
        const paramValue = searchParams[source.param]

        if (paramValue) {
            // Fetch entity data
            const entityData = await fetchEntityData(source.table, paramValue, source.fetchBy)

            if (entityData && typeof entityData === 'object' && 'error' in entityData) {
                // Failed to fetch, use empty object (creation mode)
                result[source.key] = {}
            } else if (entityData && typeof entityData === 'object') {
                // Successfully fetched
                result[source.key] = entityData[source.table] || {}
            } else {
                // Null or undefined
                result[source.key] = {}
            }
        } else {
            // No param provided, creation mode
            result[source.key] = {}
        }
    }

    return result
}

/**
 * Updates a specific field based on the binding path.
 * Path format: "table_name.column_name" or "table_name[index].column_name"
 */
export async function updateOSField(binding: string, value: any) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    // Parse binding: "table.column" or "table[index].column" or "table.json_col.key"
    const regex = /^([a-z_]+)(?:\[(\d+)\])?\.([a-z0-9_.]+)$/
    const match = binding.match(regex)

    if (!match) {
        console.error(`Invalid binding format: ${binding}`)
        return { error: 'Invalid binding format' }
    }

    const [_, tableName, arrayIndex, columnPath] = match

    // Security check: Allow any os_ table
    if (!tableName.startsWith('os_')) {
        throw new Error('Invalid table access')
    }

    // Helper to handle deep updates (JSON columns)
    const performUpdate = async (id: string, currentData: any) => {
        const parts = columnPath.split('.')
        const colName = parts[0]

        let updatePayload: any = {}

        if (parts.length > 1) {
            const currentJson = currentData?.[colName] || {}
            let pointer = currentJson

            // Traverse to the second to last key
            for (let i = 1; i < parts.length - 1; i++) {
                if (!pointer[parts[i]]) pointer[parts[i]] = {}
                pointer = pointer[parts[i]]
            }

            // Set value
            pointer[parts[parts.length - 1]] = value

            updatePayload[colName] = currentJson
        } else {
            // Standard column update
            updatePayload[colName] = value
        }

        const { error } = await supabase.from(tableName).update({
            ...updatePayload,
            updated_at: new Date().toISOString()
        }).eq('id', id)

        if (error) throw error
    }


    try {
        if (arrayIndex !== undefined) {
            const idx = parseInt(arrayIndex)
            // Assuming user_id is the foreign key for lists, but for generic entities this might differ.
            // For now, sticking to user_id assumption for lists as that's the main use case for arrays.
            // If editing 'os_car_parts', it might be 'car_id'. This is a limitation for now.
            const { data: list } = await supabase.from(tableName).select('*').eq('user_id', user.id).order('created_at', { ascending: true })

            if (!list || !list[idx]) {
                // ... (Create logic - simplified for brevity, assume append)
                if (list && idx === list.length) {
                    // Prepare insert payload
                    const parts = columnPath.split('.')
                    const colName = parts[0]
                    let insertPayload: any = { user_id: user.id }

                    if (parts.length > 1) {
                        // JSON init
                        let jsonRoot: any = {}
                        let pointer = jsonRoot
                        for (let i = 1; i < parts.length - 1; i++) {
                            pointer[parts[i]] = {}
                            pointer = pointer[parts[i]]
                        }
                        pointer[parts[parts.length - 1]] = value
                        insertPayload[colName] = jsonRoot
                    } else {
                        insertPayload[colName] = value
                    }

                    // Defaults for specific tables to pass NOT NULL constraints
                    if (tableName === 'os_user_work_history') {
                        insertPayload.team_name = insertPayload.team_name || 'New Team'
                        insertPayload.role = insertPayload.role || 'New Role'
                    }

                    const { error } = await supabase.from(tableName).insert(insertPayload)
                    if (error) throw error
                } else {
                    // Fallback create [0]
                    if (idx === 0 && (!list || list.length === 0)) {
                        const insertPayload: any = { user_id: user.id, team_name: 'New Team', role: 'New Role' }
                        const parts = columnPath.split('.')
                        const colName = parts[0]
                        if (parts.length > 1) {
                            let jsonRoot: any = {}
                            jsonRoot[parts[1]] = value
                            insertPayload[colName] = jsonRoot
                        } else {
                            insertPayload[colName] = value
                        }

                        const { error } = await supabase.from(tableName).insert(insertPayload)
                        if (error) throw error
                    }
                }
            } else {
                await performUpdate(list[idx].id, list[idx])
            }

        } else {
            // 1:1 Table or Single Entity
            // For generic entities, we might not query by user_id if we have an ID?
            // But updateOSField takes a binding, which doesn't include ID.
            // So updateOSField is still primarily for "My Profile" or context-aware singletons.
            // For generic entities, we should probably rely on saveOSContext which allows passing the whole object with IDs.

            // However, to keep it working for existing user profile stuff:
            if (tableName.startsWith('os_user_')) {
                const { data: existing } = await supabase.from(tableName).select('*').eq(tableName === 'os_user_profiles' ? 'id' : 'user_id', user.id).single()
                if (existing) {
                    await performUpdate(existing.id, existing)
                } else {
                    // Insert logic similar to before
                    const parts = columnPath.split('.')
                    const colName = parts[0]
                    let insertPayload: any = {}

                    // os_user_profiles uses 'id' as the user identifier, not 'user_id'
                    if (tableName === 'os_user_profiles') {
                        insertPayload.id = user.id
                    } else {
                        insertPayload.user_id = user.id
                    }

                    if (parts.length > 1) {
                        let jsonRoot: any = {}
                        jsonRoot[parts[1]] = value
                        insertPayload[colName] = jsonRoot
                    } else {
                        insertPayload[colName] = value
                    }
                    const { error } = await supabase.from(tableName).insert(insertPayload)
                    if (error) throw error
                }
            } else {
                // Generic OS table update via binding? 
                // We don't know the ID here. 
                // So updateOSField is limited to User context.
                // We'll proceed with that limitation and rely on saveOSContext for generic stuff.
                throw new Error(`Single field update not supported for generic table ${tableName} without context.`)
            }
        }

        revalidatePath('/apps') // Revalidate cache
        return { success: true }
    } catch (err: any) {
        console.error("Update Error:", err)
        return { error: err.message }
    }
}

/**
 * Bulk updates the OS context data.
 * Iterates through the provided data object and updates corresponding tables.
 * Data keys can be either table names (e.g., os_user_profiles) or dataSource keys (e.g., 'user')
 * If sourceMapping is provided, it maps dataSource keys to table names.
 */
export async function saveOSContext(
    data: Record<string, any>,
    targetUserId?: string,
    sourceMapping?: Record<string, string>
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    // Use targetUserId if provided (for Supabase Admin) or default to current user
    const effectiveUserId = targetUserId || user.id

    const results = []

    for (const [key, record] of Object.entries(data)) {
        // Map dataSource key to table name if mapping provided
        const tableName = sourceMapping?.[key] || key

        // Security: Only allow os_ tables
        if (!tableName.startsWith('os_')) continue

        // Handle Array tables (like work history) vs Object tables (like profile)
        if (Array.isArray(record)) {
            // For arrays, we probably need a sync strategy (upsert/delete).
            // For MVP, let's just Upsert all with user_id or parent_id?
            // If generic, we can't assume user_id.

            for (const item of record) {
                let payload = { ...item, updated_at: new Date().toISOString() }

                // If it's a user table, enforce user_id (except os_user_profiles which uses 'id')
                if (tableName.startsWith('os_user_') && tableName !== 'os_user_profiles') {
                    payload.user_id = effectiveUserId
                }

                const { error } = await supabase.from(tableName).upsert(payload)
                if (error) console.error(`Error saving ${tableName}:`, error)
            }
        } else if (typeof record === 'object' && record !== null) {
            // Single record tables
            let payload = { ...record, updated_at: new Date().toISOString() }

            // Ensure ID/User_ID for user tables
            if (tableName === 'os_user_profiles') {
                payload.id = effectiveUserId
            } else if (tableName.startsWith('os_user_')) {
                payload.user_id = effectiveUserId
            }

            const { error } = await supabase.from(tableName).upsert(payload)
            if (error) {
                console.error(`Error saving ${tableName}:`, error)
                results.push({ table: tableName, error: error.message })
            } else {
                results.push({ table: tableName, success: true })
            }
        }
    }

    revalidatePath('/', 'layout')
    revalidatePath('/profile', 'layout')
    revalidatePath('/apps', 'layout')

    const hasErrors = results.some(r => r.error)
    return { success: !hasErrors, results }
}
