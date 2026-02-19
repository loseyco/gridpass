'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const JobSchema = z.object({
    title: z.string().min(3),
    company_name: z.string().min(2),
    location: z.string().optional(),
    salary_range: z.string().optional(),
    description: z.string().min(10),
    type: z.enum(['full-time', 'contract', 'part-time']).default('full-time'),
    remote: z.boolean().optional(),
    external_url: z.string().url().optional().or(z.literal('')),
})

const GigSchema = z.object({
    title: z.string().min(3),
    location: z.string().optional(),
    daily_rate: z.number().min(0).optional(),
    description: z.string().min(10),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    is_urgent: z.boolean().optional(),
    category: z.string().optional(),
})

export async function createJob(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        console.error('Create Job: Unauthorized')
        return { error: 'Unauthorized' }
    }

    const rawData = {
        title: formData.get('title'),
        company_name: formData.get('company_name'),
        location: formData.get('location'),
        salary_range: formData.get('salary_range'),
        description: formData.get('description'),
        external_url: formData.get('external_url'),
        // Add remote logic if we add a column, for now storing in location or description could work, 
        // but let's stick to standard fields for now.
    }

    // console.log('Create Job Payload:', rawData)

    try {
        const validated = JobSchema.parse(rawData)

        const { error } = await supabase
            .from('os_jobs')
            .insert({
                user_id: user.id,
                title: validated.title,
                company_name: validated.company_name,
                role: validated.title, // 'role' seems redundant with title but schema has it
                location: validated.location,
                salary_range: validated.salary_range,
                description: validated.description,
                external_url: validated.external_url || null,
                status: 'open'
            })

        if (error) {
            console.error('Supabase Insert Error:', error)
            throw error
        }

        revalidatePath('/jobs')
        return { success: true }
    } catch (e) {
        console.error('Create Job Error:', e)
        return { error: 'Failed to create job' }
    }
}

export async function createGig(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        console.error('Create Gig: Unauthorized')
        return { error: 'Unauthorized' }
    }

    const rawData = {
        title: formData.get('title'),
        location: formData.get('location'),
        daily_rate: Number(formData.get('daily_rate')),
        description: formData.get('description'),
        category: formData.get('category'),
        is_urgent: formData.get('is_urgent') === 'on',
    }

    // console.log('Create Gig Payload:', rawData)

    try {
        const validated = GigSchema.parse(rawData)

        const { error } = await supabase
            .from('os_gigs')
            .insert({
                created_by: user.id,
                title: validated.title,
                role: validated.title,
                location: validated.location,
                daily_rate: validated.daily_rate,
                description: validated.description,
                category: validated.category || 'General',
                is_urgent: validated.is_urgent,
                status: 'open',
                duration_type: 'contract', // Default matches constraint
                // We need start/end dates usually, but making them optional for quick post
                start_date: new Date().toISOString(),
                end_date: new Date(Date.now() + 86400000).toISOString() // Tomorrow
            })

        if (error) {
            console.error('Supabase Insert Error:', error)
            throw error
        }

        revalidatePath('/jobs')
        return { success: true }
    } catch (e) {
        console.error('Create Gig Error:', e)
        return { error: 'Failed to create gig' }
    }
}
