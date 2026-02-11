'use server';

import { createClient } from '@/utils/supabase/server';
import { Vehicle, Tool } from '@/types/garage';
import { revalidatePath } from 'next/cache';

export async function getGarage(userId: string) {
    const supabase = await createClient();

    const { data: vehicles, error: vehiclesError } = await supabase
        .from('user_vehicles')
        .select('*, collection:collections(owner_type, visibility, is_default, name)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (vehiclesError) throw new Error(vehiclesError.message);

    const { data: tools, error: toolsError } = await supabase
        .from('user_tools')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (toolsError) throw new Error(toolsError.message);

    return {
        vehicles: vehicles as Vehicle[],
        tools: tools as Tool[]
    };
};

export async function getVehicle(id: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('user_vehicles')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return null;
    return data as Vehicle;
}

// --- Vehicles ---

export async function addVehicle(data: Partial<Vehicle>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const { error } = await supabase
        .from('user_vehicles')
        .insert({
            ...data,
            user_id: user.id
        });

    if (error) throw new Error(error.message);
    revalidatePath('/dashboard/profile');
    revalidatePath(`/u/${user.user_metadata.username}`);
}

export async function updateVehicle(id: string, data: Partial<Vehicle>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const { error } = await supabase
        .from('user_vehicles')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id); // Ensure ownership

    if (error) throw new Error(error.message);
    revalidatePath('/dashboard/profile');
    revalidatePath(`/u/${user.user_metadata.username}`);
}

export async function deleteVehicle(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    console.log('Server Action: Delete Vehicle', id, 'User:', user.id);

    const { error } = await supabase
        .from('user_vehicles')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) throw new Error(error.message);
    revalidatePath('/dashboard/profile');
    revalidatePath(`/u/${user.user_metadata.username}`);
}

// --- Tools ---

export async function addTool(data: Partial<Tool>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const { error } = await supabase
        .from('user_tools')
        .insert({
            ...data,
            user_id: user.id
        });

    if (error) throw new Error(error.message);
    revalidatePath('/dashboard/profile');
    revalidatePath(`/u/${user.user_metadata.username}`);
}

export async function updateTool(id: string, data: Partial<Tool>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const { error } = await supabase
        .from('user_tools')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) throw new Error(error.message);
    revalidatePath('/dashboard/profile');
    revalidatePath(`/u/${user.user_metadata.username}`);
}

export async function deleteTool(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const { error } = await supabase
        .from('user_tools')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) throw new Error(error.message);
    revalidatePath('/dashboard/profile');
    revalidatePath(`/u/${user.user_metadata.username}`);
}
