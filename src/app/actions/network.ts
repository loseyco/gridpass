'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type NetworkEntity = {
    id: string
    name: string
    type: 'shop' | 'team' | 'club' | 'track' | 'service' | 'expert'
    description?: string
    location?: string
    website?: string
    image_url?: string
    status?: string
    tags?: string[]
    username?: string
}

export async function getNetworkEntities(filter: { type?: string, search?: string }) {
    const supabase = await createClient()
    let entities: NetworkEntity[] = []

    // 1. Fetch Organizations (Tracks, Shops, Teams)
    if (!filter.type || ['track', 'shop', 'team', 'club'].includes(filter.type)) {
        let orgQuery = supabase
            .from('organizations')
            .select('*')
            .in('status', ['active', 'verified', 'pending_claim'])
            .order('name', { ascending: true })

        if (filter.type) {
            orgQuery = orgQuery.eq('type', filter.type)
        }
        if (filter.search) {
            orgQuery = orgQuery.ilike('name', `%${filter.search}%`)
        }

        const { data: orgs } = await orgQuery
        if (orgs) {
            entities = [...entities, ...orgs.map(o => ({
                id: o.id,
                name: o.name,
                type: o.type,
                description: o.description,
                location: o.location,
                website: o.website,
                image_url: o.logo_url,
                status: o.status
            }))]
        }
    }

    // 2. Fetch Experts (Profiles with specific roles or skills)
    if (!filter.type || filter.type === 'expert') {
        let profileQuery = supabase
            .from('profiles')
            .select('*')
            // Filter logic for "Experts" - e.g. has skills, or specific roles
            // For now, let's assume anyone with a 'mechanic' or 'driver' badge or skills listed is an expert
            .not('full_name', 'is', null)

        if (filter.search) {
            profileQuery = profileQuery.ilike('full_name', `%${filter.search}%`)
        }

        const { data: profiles } = await profileQuery

        if (profiles) {
            // Client-side filter for "Expert" criteria if complex
            const experts = profiles.filter(p => {
                const hasSkills = p.skills && p.skills.length > 0;
                const hasRoleInfo = (p.mechanic_info && Object.keys(p.mechanic_info).length > 0) ||
                    (p.driver_info && Object.keys(p.driver_info).length > 0);
                return hasSkills || hasRoleInfo;
            }).map(p => ({
                id: p.id,
                name: p.full_name || p.username,
                type: 'expert' as const,
                description: p.skills ? p.skills.join(', ') : 'Racing Professional',
                location: p.real_world_info?.location || 'Remote/Traveling',
                image_url: p.avatar_url,
                status: 'verified', // Profiles are generally verified users
                tags: p.skills,
                username: p.username
            }));
            entities = [...entities, ...experts]
        }
    }

    return entities
}

export async function findOpportunities() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    // 1. Get User Skills/Services
    const { data: services } = await supabase
        .from('services')
        .select('title, tags, category')
        .eq('user_id', user.id)

    if (!services || services.length === 0) return []

    // Extract keywords
    const keywords = new Set<string>()
    services.forEach(s => {
        keywords.add(s.title.toLowerCase())
        if (s.tags) s.tags.forEach((t: string) => keywords.add(t.toLowerCase()))
        if (s.category) keywords.add(s.category.toLowerCase())
    })

    // 2. Find Organizations matching keywords in description or notes
    // This is a basic implementation. Semantic search would be better later.
    const { data: allOrgs } = await supabase
        .from('organizations')
        .select('*')
        .eq('status', 'active')

    const matches = allOrgs?.filter(org => {
        const text = `${org.name} ${org.description || ''} ${org.notes || ''}`.toLowerCase()
        // Check if any keyword is present
        for (const keyword of Array.from(keywords)) {
            if (text.includes(keyword)) return true
        }
        return false
    }) || []

    return matches.map(o => ({
        id: o.id,
        name: o.name,
        type: o.type,
        description: o.description,
        location: o.location,
        match_reason: 'Matches your services'
    }))
}
