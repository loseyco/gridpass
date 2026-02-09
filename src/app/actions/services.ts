'use server';

import { createClient } from '@/utils/supabase/server';
import { Service, ServiceFormData, ServiceFilters } from '@/types/services';
import { revalidatePath } from 'next/cache';

export async function createService(data: ServiceFormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Not authenticated');
    }

    const { error } = await supabase.from('services').insert({
        ...data,
        user_id: user.id
    });

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath('/dashboard/services');
    revalidatePath('/services');
    // We might not have username easily available here without an extra fetch, 
    // but we can revalidate the general services page and dashboard.
}

export async function updateService(id: string, data: ServiceFormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Not authenticated');
    }

    const { error } = await supabase
        .from('services')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath('/dashboard/services');
    revalidatePath('/services');
}

export async function deleteService(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Not authenticated');
    }

    const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath('/dashboard/services');
    revalidatePath('/services');
}

export async function getServices(filters?: ServiceFilters) {
    const supabase = await createClient();

    let query = supabase.from('services').select(`
        *,
        profiles:user_id (
            username,
            full_name,
            avatar_url
        )
    `).eq('is_active', true);

    if (filters?.category) {
        query = query.eq('category', filters.category);
    }

    if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching services:', error);
        return [];
    }

    return data as any[]; // Type assertion needed for joined data
}

export async function getMyServices() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching my services:', error);
        return [];
    }

    return data as Service[];
}
