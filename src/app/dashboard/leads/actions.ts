'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateLeadStatus(id: string, status: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('leads')
        .update({ status })
        .eq('id', id);

    if (error) {
        console.error('Error updating lead status:', error);
        throw new Error('Failed to update lead status');
    }

    revalidatePath('/dashboard/leads');
    return { success: true };
}
