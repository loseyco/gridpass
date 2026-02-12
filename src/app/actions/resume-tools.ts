'use server';

import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { randomBytes } from 'crypto';

// Initialize Admin Client (for bypassing RLS to create tokens and read leads)
const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function generateToken() {
    return randomBytes(16).toString('hex');
}

export async function createClaimLink(email: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    // 1. Find the Shadow Profile (Lead) by Email
    // Use arrow operator for more reliable JSONB filtering
    const { data: leadData, error: lookupError } = await supabaseAdmin
        .from('leads')
        .select('id, name')
        .eq('contact_info->>email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (lookupError || !leadData) {
        console.error('Lead lookup failed:', lookupError);
        return { error: 'Shadow profile not found. Please ensure the resume application created a lead.' };
    }

    // 2. Create Claim Token
    const token = generateToken();
    const { error: tokenError } = await supabaseAdmin
        .from('claim_tokens')
        .insert({
            token,
            entity_type: 'lead',
            entity_id: leadData.id,
            created_by: user.id
        })
        .select()
        .single();

    if (tokenError) {
        console.error('Token creation failed:', tokenError);
        return { error: 'Failed to generate claim link.' };
    }

    return { success: true, path: `/claim/${token}` };
}

export async function researchCandidate(name: string, jobTitle: string) {
    // Placeholder for AI Research
    await new Promise(resolve => setTimeout(resolve, 1500));

    return {
        success: true,
        summary: `### AI Research for ${name}
        
**Potential Matches Found:**
- LinkedIn: Found profile matching "${name}" with role "${jobTitle}".
- **Experience Note**: Activity suggests recent involvement in GT series.

**Key Highlights:**
- Based on phone number, likely US/Canada based.
- Skills align with resume claims.

*Note: This is a placeholder response. Configure live search API for real data.*`
    };
}
