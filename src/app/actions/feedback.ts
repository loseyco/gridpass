'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function submitFeedback(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const type = formData.get('type') as 'bug' | 'feature' | 'contact' | 'other';
    const page_url = formData.get('page_url') as string;

    if (!description || !type) {
        return { error: 'Missing required fields' };
    }

    // If it's a feature request, we also want to add it to the public features table so users can vote on it.
    // Although the requirement says "we then put that in our database of task we need to look at as an admin",
    // keeping the existing public feature request flow logic for 'feature' type seems correctly aligned with previous implementation,
    // BUT the new requirement is specific about a "admin database of tasks".
    // So I will insert into the new `feedback_submissions` table for ALL types.
    // If it is a feature request, we can OPTIONALLY also insert into `features` OR just let the admin decide to promote it later.
    // Given the prompt "we then put that in our database of task we need to look at as an admin",
    // I will just put it in `feedback_submissions` for now to keep it simple and centralized for admin review.

    const { error } = await supabase
        .from('feedback_submissions')
        .insert({
            user_id: user?.id || null, // Allow anonymous submissions if user is not logged in? policy says true for insert, so yes.
            type,
            title: title || null,
            message: description,
            page_url: page_url || null,
            status: 'new'
        });

    if (error) {
        console.error('Error submitting feedback:', error);
        return { error: 'Failed to submit feedback' };
    }

    return { success: true };
}

export async function getFeedbackSubmissions(status?: string, type?: string) {
    const supabase = await createClient();

    let query = supabase
        .from('feedback_submissions')
        .select(`
            *,
            profiles:user_id (
                username,
                full_name,
                avatar_url
            )
        `)
        .order('created_at', { ascending: false });

    if (status) {
        query = query.eq('status', status);
    }

    if (type) {
        query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching feedback:', error);
        return [];
    }

    return data;
}

export async function updateFeedbackStatus(id: string, status: 'new' | 'reviewed' | 'archived') {
    const supabase = await createClient();

    const { error } = await supabase
        .from('feedback_submissions')
        .update({ status })
        .eq('id', id);

    if (error) {
        console.error('Error updating feedback status:', error);
        return { error: 'Failed to update status' };
    }

    revalidatePath('/admin/feedback');
    return { success: true };
}
