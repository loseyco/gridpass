'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { CareerEntry } from '@/types/career';

export async function quickLogEvent(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const title = formData.get('title') as string;
    const organization = formData.get('organization') as string;
    const event_name = formData.get('event_name') as string;
    const vehicle_info = formData.get('vehicle_info') as string;

    const newEntry: CareerEntry = {
        id: crypto.randomUUID(),
        type: 'event',
        title: title || 'Crew Member', // Default if quick logging
        organization: organization,
        event_name: event_name,
        vehicle_info: vehicle_info,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0], // Defaults to single day, user can edit later
        is_current: false,
        location: '', // User can fill later
        description: 'Quick logged event.',
    };

    // 1. Fetch current history
    const { data: profile } = await supabase
        .from('profiles')
        .select('career_history, username')
        .eq('id', user.id)
        .single();

    const currentHistory = (profile?.career_history || []) as CareerEntry[];

    // 2. Append new entry
    const updatedHistory = [...currentHistory, newEntry];

    // 3. Save
    const { error } = await supabase
        .from('profiles')
        .update({ career_history: updatedHistory })
        .eq('id', user.id);

    if (error) throw new Error(error.message);

    revalidatePath('/dashboard');
    revalidatePath(`/u/${profile?.username}`);

    return { success: true };
}
