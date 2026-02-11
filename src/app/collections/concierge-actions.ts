'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const taskSchema = z.object({
    collection_id: z.string().uuid(),
    vehicle_id: z.string().uuid().optional().or(z.literal('')),
    type: z.enum(['Sourcing', 'Logistics', 'Maintenance', 'Travel', 'Detailing', 'Storage', 'Driving', 'Sales', 'Event', 'Other']),
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    scheduled_date: z.string().optional(), // ISO string from form
    billing_method: z.enum(['Fixed', 'Hourly', 'Commission', 'Reimbursement']),
    estimated_cost: z.coerce.number().optional(),
    client_price: z.coerce.number().optional(),
});

export async function createConciergeTask(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    const rawData = {
        collection_id: formData.get('collection_id'),
        vehicle_id: formData.get('vehicle_id'),
        type: formData.get('type'),
        title: formData.get('title'),
        description: formData.get('description'),
        scheduled_date: formData.get('scheduled_date'),
        billing_method: formData.get('billing_method'),
        estimated_cost: formData.get('estimated_cost'),
        client_price: formData.get('client_price'),
    };

    const validated = taskSchema.safeParse(rawData);

    if (!validated.success) {
        return { error: 'Invalid fields', fields: validated.error.flatten().fieldErrors };
    }

    // Verify access to collection
    const { data: hasAccess } = await supabase
        .from('collections')
        .select('id')
        .eq('id', validated.data.collection_id)
        .single();

    // RLS on insert will also fail if no access, but good to check explicit if we want custom error
    // For now rely on RLS policy we created: "Users can manage tasks for their collections"

    // transform empty vehicle_id to null
    const dataToInsert = {
        ...validated.data,
        vehicle_id: validated.data.vehicle_id || null,
        created_by: user.id,
        status: 'Pending'
    };

    const { error } = await supabase
        .from('concierge_tasks')
        .insert(dataToInsert);

    if (error) {
        console.error('Task Creation Error:', error);
        return { error: 'Failed to create task.' };
    }

    revalidatePath(`/collections/${validated.data.collection_id}`);
    redirect(`/collections/${validated.data.collection_id}/concierge`);
}

export async function getCollectionTasks(collectionId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('concierge_tasks')
        .select(`
            *,
            vehicle:vehicle_id(id, year, make, model)
        `)
        .eq('collection_id', collectionId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching tasks:', error);
        return [];
    }

    return data;
}

export async function updateTaskStatus(taskId: string, status: string, path: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('concierge_tasks')
        .update({ status })
        .eq('id', taskId);

    if (error) {
        console.error('Error updating task:', error);
        return { error: 'Failed to update status' };
    }

    revalidatePath(path);
    return { success: true };
}

export async function createClientTeam(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    const name = formData.get('name') as string;
    const initialCollectionName = formData.get('collection_name') as string || `${name}'s Collection`;

    if (!name) {
        return { error: 'Client Name is required' };
    }

    // 1. Create Team
    // Generate a slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 7);

    const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
            name,
            slug,
            owner_id: user.id
        })
        .select()
        .single();

    if (teamError) {
        console.error('Team Creation Error:', teamError);
        return { error: 'Failed to create client team.' };
    }

    // 2. Add User as Admin (Owner is already set, but let's be explicit in members if needed, 
    // though RLS/triggers might handle owner insertion. 
    // The schema policy "Users can create teams" uses insert with check owner_id = auth.uid.
    // Usually we need to insert into team_members too.

    const { error: memberError } = await supabase
        .from('team_members')
        .insert({
            team_id: team.id,
            user_id: user.id,
            role: 'owner',
            status: 'active'
        });

    if (memberError) {
        console.error('Team Member Error:', memberError);
        // Continue anyway, owner_id on team might be enough for some logic, but best to have member record
    }

    // 3. Create Default Collection
    const { data: collection, error: collectionError } = await supabase
        .from('collections')
        .insert({
            name: initialCollectionName,
            owner_type: 'team',
            owner_id: team.id,
            type: 'Private',
            visibility: 'Private'
        })
        .select()
        .single();

    if (collectionError) {
        console.error('Collection Creation Error:', collectionError);
        return { error: 'Client created, but failed to create collection.', teamId: team.id };
    }

    revalidatePath('/collections');
    return { success: true, teamId: team.id, collectionId: collection.id };
}
