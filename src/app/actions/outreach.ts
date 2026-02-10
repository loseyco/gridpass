'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Mock Enrichment for now (since we don't have keys yet)
export async function enrichOrganization(orgId: string, domain: string) {
    // In real life: Call Clearbit/Apollo/Hunter here
    console.log(`Enriching ${domain}...`)

    // Simulate finding data
    const mockData = {
        contact_email: `info@${domain}`,
        description: 'Enriched description from external source.',
        employees: 50
    }

    const supabase = await createClient()
    const { error } = await supabase
        .from('organizations')
        .update({
            contact_email: mockData.contact_email,
            // Could add more fields if schema supported it
            notes: `Enriched: Found ${mockData.employees} employees.`
        })
        .eq('id', orgId)

    if (error) throw error
    revalidatePath(`/admin/orgs/${orgId}`)
    return { success: true, data: mockData }
}

export async function sendOutreach(orgId: string, recipient: string, subject: string, body: string) {
    // In real life: Call SendGrid/instantly.ai/Gmail API
    // For now, we will just log it as a "Manual Email" note.

    const supabase = await createClient()

    // 1. Fetch current notes to append (or just use a separate activity log table later)
    const { data: org } = await supabase
        .from('organizations')
        .select('notes')
        .eq('id', orgId)
        .single()

    const timestamp = new Date().toLocaleString()
    const newNote = `${org?.notes || ''}\n\n[${timestamp}] OUTREACH SENT to ${recipient}:\nSubject: ${subject}`

    const { error } = await supabase
        .from('organizations')
        .update({
            notes: newNote,
            lead_status: 'contacted'
        })
        .eq('id', orgId)

    if (error) throw error
    revalidatePath(`/admin/orgs/${orgId}`)
    revalidatePath('/admin/orgs') // Update list view too
    return { success: true }
}
