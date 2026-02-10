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
    };

    const validatedFields = vehicleSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return { error: 'Invalid fields', fields: validatedFields.error.flatten().fieldErrors };
    }

    const { error } = await supabase
        .from('user_vehicles')
        .insert({
            ...validatedFields.data,
            user_id: user.id
        });

    if (error) {
        console.error('Database Error:', error);
        return { error: 'Failed to create vehicle.' };
    }

    revalidatePath('/garage');
    redirect('/garage');
}
export async function deleteVehicle(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    const { error } = await supabase
        .from('user_vehicles')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error('Database Error:', error);
        return { error: 'Failed to delete vehicle.' };
    }

    revalidatePath('/garage');
    redirect('/garage');
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
