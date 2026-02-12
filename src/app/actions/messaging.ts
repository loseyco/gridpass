'use server';

import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function sendGuestMessage(token: string, content: string) {
    if (!content || !content.trim()) return { error: 'Message cannot be empty.' };

    // 1. Verify Token
    const { data: tokenData, error: tokenError } = await supabaseAdmin
        .from('claim_tokens')
        .select('*')
        .eq('token', token)
        .single();

    if (tokenError || !tokenData) {
        return { error: 'Invalid token.' };
    }

    // 2. Fetch Entity (Lead)
    if (tokenData.entity_type !== 'lead') {
        return { error: 'Messaging only available for personal profiles.' };
    }

    const { data: lead } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('id', tokenData.entity_id)
        .single();

    if (!lead) return { error: 'Lead data not found.' };

    const contact = lead.contact_info || {};
    const senderName = lead.name;
    const senderEmail = contact.email || 'unknown@resume.app';
    const recipientId = tokenData.created_by;

    // 3. Send Message
    const { error: msgError } = await supabaseAdmin
        .from('profile_messages')
        .insert({
            recipient_id: recipientId,
            sender_name: `${senderName} (Guest)`,
            sender_email: senderEmail,
            content: content,
            is_read: false
        });

    if (msgError) {
        console.error('Message send error:', msgError);
        return { error: 'Failed to send message.' };
    }

    return { success: true };
}
