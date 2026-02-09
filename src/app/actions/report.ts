'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Report a profile for spam, abuse, etc.
 * 
 * Ideally stores in a 'reports' table.
 * For now, logs 
 */
export async function reportProfile(username: string, reason: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Log the report (simulating database insert)
    console.log(`🚨 REPORT SUBMITTED:
        Reporter: ${user?.id || 'Anonymous'}
        Target Profile: ${username}
        Reason: ${reason}
        Time: ${new Date().toISOString()}
    `);

    // In a real app:
    // await supabase.from('reports').insert({ reporter_id: user?.id, target_username: username, reason });
    // await sendAdminNotification(`New Report against ${username}: ${reason}`);

    return { success: true, message: 'Report submitted. Thank you for keeping GridPass safe.' };
}
