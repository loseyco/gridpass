import React from 'react'
import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import BizSiteClient from './BizSiteClient'

export default async function BizSitePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const supabase = await createClient()

    // Fetch organization by slug
    const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', slug)
        .eq('site_enabled', true)
        .single()

    if (orgError || !org) {
        console.error(`Organization not found or site disabled: ${slug}`, orgError)
        notFound()
    }

    // Fetch all related data for the micro-site
    const [servicesRes, galleryRes, hoursRes, socialRes] = await Promise.all([
        supabase.from('org_services').select('*').eq('org_id', org.id).order('display_order'),
        supabase.from('org_gallery').select('*').eq('org_id', org.id).order('display_order'),
        supabase.from('org_hours').select('*').eq('org_id', org.id).order('day_of_week'),
        supabase.from('org_social_links').select('*').eq('org_id', org.id)
    ])

    const siteData = {
        ...org,
        org_services: servicesRes.data || [],
        org_gallery: galleryRes.data || [],
        org_hours: hoursRes.data || [],
        org_social_links: socialRes.data || []
    }

    return <BizSiteClient org={siteData} />
}
