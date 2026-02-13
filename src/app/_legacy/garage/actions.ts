'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const vehicleSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    type: z.enum(['Sim Rig', 'Race Car', 'Street Car', 'Trailer', 'Kart', 'Other']),
    make: z.string().optional(),
    model: z.string().optional(),
    year: z.string().transform(val => val ? parseInt(val) : undefined).optional(),
    vin: z.string().optional(),
    sim_platform: z.string().optional(),
    description: z.string().optional(),
    collection_id: z.string().uuid().optional().nullable(),
});

export async function addVehicle(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    const rawData = {
        name: formData.get('name'),
        type: formData.get('type'),
        make: formData.get('make'),
        model: formData.get('model'),
        year: formData.get('year'),
        vin: formData.get('vin'),
        sim_platform: formData.get('sim_platform'),
        description: formData.get('description'),
        collection_id: formData.get('collection_id') || null,
    };

    const validatedFields = vehicleSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return { error: 'Invalid fields', fields: validatedFields.error.flatten().fieldErrors };
    }

    const dataToInsert = { ...validatedFields.data, user_id: user.id };

    // Verify collection access if provided
    if (dataToInsert.collection_id) {
        const { data: collection } = await supabase
            .from('collections')
            .select('owner_type, owner_id')
            .eq('id', dataToInsert.collection_id)
            .single();

        if (!collection) {
            return { error: 'Collection not found' };
        }

        if (collection.owner_type === 'user') {
            if (collection.owner_id !== user.id) return { error: 'Unauthorized access to collection' };
        } else if (collection.owner_type === 'team') {
            const { data: member } = await supabase
                .from('team_members')
                .select('role')
                .eq('team_id', collection.owner_id)
                .eq('user_id', user.id)
                .single();

            // Allow members to add vehicles? Maybe only admins? Let's allow members for now.
            if (!member) return { error: 'You are not a member of this team collection' };
        }
    }

    const { error } = await supabase
        .from('user_vehicles')
        .insert(dataToInsert);

    if (error) {
        console.error('Database Error:', error);
        return { error: 'Failed to create vehicle.' };
    }

    if (dataToInsert.collection_id) {
        revalidatePath(`/collections/${dataToInsert.collection_id}`);
        redirect(`/collections/${dataToInsert.collection_id}`);
    } else {
        revalidatePath('/garage');
        redirect('/garage');
    }
}
export async function deleteVehicle(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    // Fetch vehicle first to check collection_id for redirect
    const { data: vehicle } = await supabase
        .from('user_vehicles')
        .select('collection_id')
        .eq('id', id)
        .single();

    const { error } = await supabase
        .from('user_vehicles')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error('Database Error:', error);
        return { error: 'Failed to delete vehicle.' };
    }

    if (vehicle?.collection_id) {
        revalidatePath(`/collections/${vehicle.collection_id}`);
        redirect(`/collections/${vehicle.collection_id}`);
    } else {
        revalidatePath('/garage');
        redirect('/garage');
    }
}

const partSchema = z.object({
    name: z.string().min(1),
    category: z.string().optional(),
    part_number: z.string().optional(),
    status: z.enum(['good', 'worn', 'failed', 'replaced']),
    vehicle_id: z.string().uuid(),
    current_mileage: z.coerce.number().optional(),
    lifespan_mileage: z.coerce.number().optional()
});

export async function addPart(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const rawData = {
        name: formData.get('name'),
        category: formData.get('category'),
        part_number: formData.get('part_number'),
        status: formData.get('status'),
        vehicle_id: formData.get('vehicle_id'),
        current_mileage: formData.get('current_mileage'),
        lifespan_mileage: formData.get('lifespan_mileage')
    };

    const validated = partSchema.safeParse(rawData);
    if (!validated.success) return { error: 'Invalid fields' };

    const { count } = await supabase.from('user_vehicles').select('*', { count: 'exact', head: true }).eq('id', validated.data.vehicle_id).eq('user_id', user.id);
    if (!count) return { error: 'Vehicle not found' };

    const { error } = await supabase.from('parts').insert(validated.data);
    if (error) return { error: 'Failed to add part' };

    revalidatePath(`/garage/${validated.data.vehicle_id}`);
}

const logSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    type: z.enum(['maintenance', 'repair', 'upgrade', 'setup']),
    vehicle_id: z.string().uuid(),
    mileage: z.coerce.number().optional(),
    cost: z.coerce.number().optional(),
    date: z.string().optional()
});

export async function addLog(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const rawData = {
        title: formData.get('title'),
        description: formData.get('description'),
        type: formData.get('type'),
        vehicle_id: formData.get('vehicle_id'),
        mileage: formData.get('mileage'),
        cost: formData.get('cost'),
        date: formData.get('date') || new Date().toISOString()
    };

    const validated = logSchema.safeParse(rawData);
    if (!validated.success) return { error: 'Invalid fields' };

    // Verify ownership
    const { count } = await supabase.from('user_vehicles').select('*', { count: 'exact', head: true }).eq('id', validated.data.vehicle_id).eq('user_id', user.id);
    if (!count) return { error: 'Vehicle not found' };

    const { error } = await supabase.from('maintenance_logs').insert(validated.data);
    if (error) return { error: 'Failed to add log' };

    revalidatePath(`/garage/${validated.data.vehicle_id}`);
}
