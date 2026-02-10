'use server';

import { createClient } from '@/utils/supabase/server';
import { Service, ServiceFormData } from '@/types/services';
import { revalidatePath } from 'next/cache';

export async function getServices({ userId, search, category }: { userId?: string, search?: string, category?: string } = {}): Promise<Service[]> {
    const supabase = await createClient();

    let query = supabase
        .from('user_services')
        .select('*');

    if (userId) {
        query = query.eq('user_id', userId);
    }

    if (category && category !== 'All') {
        query = query.eq('category', category);
    }

    if (search) {
        query = query.ilike('title', `%${search}%`);
    }

    const { data, error } = await query.order('price', { ascending: true });

    if (error) {
        console.error('Error fetching services:', error);
        return [];
    }

    return data as Service[];
}

export async function getMyServices(): Promise<Service[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('user_services')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching my services:', error);
        throw new Error('Failed to fetch services');
    }

    return data as Service[];
}

export async function createService(formData: ServiceFormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
        .from('user_services')
        .insert({
            ...formData,
            user_id: user.id
        });

    if (error) {
        console.error('Error creating service:', error);
        throw new Error('Failed to create service');
    }

    revalidatePath('/dashboard/services');
    revalidatePath(`/u/${user.user_metadata.username}`);
}

export async function updateService(id: string, formData: ServiceFormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
        .from('user_services')
        .update(formData)
        .eq('id', id)
        .eq('user_id', user.id); // Ensure ownership

    if (error) {
        console.error('Error updating service:', error);
        throw new Error('Failed to update service');
    }

    revalidatePath('/dashboard/services');
    revalidatePath(`/u/${user.user_metadata.username}`);
}

export async function deleteService(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
        .from('user_services')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // Ensure ownership

    if (error) {
        console.error('Error deleting service:', error);
        throw new Error('Failed to delete service');
    }

    revalidatePath('/dashboard/services');
    revalidatePath(`/u/${user.user_metadata.username}`);
}
