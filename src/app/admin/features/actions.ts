'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getFeatures() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('features')
        .select('*')
        .order('votes', { ascending: false });

    if (error) {
        console.error('Error fetching features:', error);
        return [];
    }
    return data;
}

export async function addFeature(formData: FormData) {
    const supabase = await createClient();
    const title = formData.get('title') as string;
    const isPaid = formData.get('isPaid') === 'on';
    const sponsor = formData.get('sponsor') as string;

    const { error } = await supabase.from('features').insert({
        title,
        status: (formData.get('status') as string) || 'backlog',
        priority: isPaid ? 'high' : 'medium',
        is_paid: isPaid,
        sponsor: sponsor,
        manual_override: false,
        description: formData.get('description') as string,
        ai_notes: formData.get('aiNotes') as string,
        category: formData.get('category') as string // Added
    });

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath('/admin/features');
}

export async function updateFeatureStatus(id: string, newStatus: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('features')
        .update({ status: newStatus })
        .eq('id', id);

    if (error) console.error('Error updating status:', error);
    revalidatePath('/admin/features');
}


export async function voteFeature(id: string) {
    const supabase = await createClient();
    // In a real app, we'd check if user already voted.
    // For now, simpler increment.
    const { error } = await supabase.rpc('increment_votes', { feature_id: id });
}

export async function deleteFeature(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('features').delete().eq('id', id);
    if (error) throw new Error(error.message);
    revalidatePath('/admin/features');
}

export async function updateFeature(id: string, data: any) {
    const supabase = await createClient();

    // Convert camelCase to snake_case for DB
    const dbData: any = {};
    if (data.title !== undefined) dbData.title = data.title;
    if (data.status !== undefined) dbData.status = data.status;
    if (data.priority !== undefined) dbData.priority = data.priority;
    if (data.isPaid !== undefined) dbData.is_paid = data.isPaid;
    if (data.sponsor !== undefined) dbData.sponsor = data.sponsor;
    if (data.manualOverride !== undefined) dbData.manual_override = data.manualOverride;
    if (data.assignedExpert !== undefined) dbData.assigned_expert = data.assignedExpert;
    if (data.description !== undefined) dbData.description = data.description;
    if (data.aiNotes !== undefined) dbData.ai_notes = data.aiNotes;
    if (data.category !== undefined) dbData.category = data.category; // Added

    const { error } = await supabase.from('features').update(dbData).eq('id', id);
    if (error) throw new Error(error.message);

    // Auto-Assign if moved to in_progress
    if (dbData.status === 'in_progress') {
        // Fetch fresh data (title/ainotes might not be in payload)
        const { data: feature } = await supabase.from('features').select('title, ai_notes').eq('id', id).single();
        if (feature) {
            const request = `FEATURE_REQ: ${feature.title} - ${feature.ai_notes || 'No instructions provided.'}`;
            await supabase.from('pm_tasks').insert({
                request,
                status: 'pending'
            });
            await addFeatureLog(id, 'Auto-assigned to Project Manager queue.', 'system');
        }
    }

    revalidatePath('/admin/features');
}

export async function assignExpert(id: string, expertName: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('features')
        .update({ assigned_expert: expertName, status: 'in_progress' })
        .eq('id', id);

    if (error) throw new Error(error.message);

    // Future: Trigger PM Agent here via FS or Queue?
    // For now, simpler DB update.
    revalidatePath('/admin/features');
}

export async function getFeatureLogs(featureId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('feature_logs')
        .select('*')
        .eq('feature_id', featureId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error getting logs:', error);
        return [];
    }
    return data;
}

export async function addFeatureLog(featureId: string, message: string, type: 'user' | 'system' | 'ai') {
    const supabase = await createClient();
    const { error } = await supabase.from('feature_logs').insert({
        feature_id: featureId,
        message,
        type
    });

    if (error) throw new Error(error.message);
    revalidatePath('/admin/features');
}

export async function createPMTask(request: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('pm_tasks').insert({
        request,
        status: 'pending'
    });
    if (error) throw new Error(error.message);
    revalidatePath('/admin');
}

export async function getPMTasks() {
    const supabase = await createClient();
    const { data } = await supabase
        .from('pm_tasks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
    return data || [];
}


