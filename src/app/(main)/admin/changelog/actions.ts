'use server'

import { createClient } from '@/utils/supabase/server';
import { requireRole, ROLES } from '@/utils/rbac';
import { revalidatePath } from 'next/cache';

export async function getChangelogs() {
    const isAdmin = await requireRole(ROLES.ADMIN);
    if (!isAdmin) return [];

    const supabase = await createClient();
    const { data } = await supabase
        .from('changelogs')
        .select('*')
        .order('published_at', { ascending: false });

    return data || [];
}

export async function getChangelog(id: string) {
    const isAdmin = await requireRole(ROLES.ADMIN);
    if (!isAdmin) return null;

    const supabase = await createClient();
    const { data } = await supabase
        .from('changelogs')
        .select('*')
        .eq('id', id)
        .single();

    return data;
}

export async function saveChangelog(formData: FormData) {
    const isAdmin = await requireRole(ROLES.ADMIN);
    if (!isAdmin) throw new Error('Unauthorized');

    const id = formData.get('id') as string;
    const version = formData.get('version') as string;
    const title = formData.get('title') as string;
    const summary = formData.get('summary') as string;
    const published_at = formData.get('published_at') as string;
    const changesJson = formData.get('changes') as string;
    const is_public = formData.get('is_public') === 'true'; // Extract boolean

    if (!version || !title) {
        throw new Error('Version and Title are required');
    }

    let changes = [];
    try {
        changes = JSON.parse(changesJson);
    } catch (e) {
        throw new Error('Invalid changes JSON');
    }

    const supabase = await createClient();
    const payload: any = {
        version,
        title,
        summary,
        changes,
        is_public, // Add to payload
        published_at: published_at || new Date().toISOString(),
    };

    let error;
    if (id && id !== 'new') {
        const { error: updateError } = await supabase
            .from('changelogs')
            .update(payload)
            .eq('id', id);
        error = updateError;
    } else {
        const { error: insertError } = await supabase
            .from('changelogs')
            .insert(payload);
        error = insertError;
    }

    if (error) throw new Error(error.message);

    revalidatePath('/admin/changelog');
    revalidatePath('/changelog');
    revalidatePath('/'); // Revalidate index for "Latest News"
    return { success: true };
}

export async function deleteChangelog(id: string) {
    const isAdmin = await requireRole(ROLES.ADMIN);
    if (!isAdmin) throw new Error('Unauthorized');

    const supabase = await createClient();
    const { error } = await supabase
        .from('changelogs')
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);

    revalidatePath('/admin/changelog');
    revalidatePath('/changelog');
    return { success: true };
}
