'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getOrganizations() {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('gp_orgs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error: any) {
        console.error('Fetch Orgs Error:', error);
        return { success: false, error: error.message };
    }
}

export async function createOrganization(formData: FormData) {
    const supabase = await createClient();
    const name = formData.get('name') as string;
    const type = formData.get('type') as string;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    try {
        const { data, error } = await supabase
            .from('gp_orgs')
            .insert({
                name,
                type,
                slug,
                status: 'active'
            })
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/admin');
        return { success: true, data };
    } catch (error: any) {
        console.error('Create Org Error:', error);
        return { success: false, error: error.message };
    }
}
