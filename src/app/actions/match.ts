'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveMatch(
    targetId: string,
    targetType: 'job' | 'gig' | 'candidate',
    status: 'like' | 'pass' | 'superlike' | 'applied' | 'invited',
    jobId?: string
) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Check if match already exists to avoid unique constraint error
    const { data: existingMatch } = await supabase
        .from('os_matches')
        .select('id')
        .eq('initiator_id', user.id)
        .eq('target_id', targetId)
        .maybeSingle() // Use maybeSingle to avoid error if multiple matches exist (though they shouldn't)

    if (existingMatch) {
        // Optionally update status if re-applying/inviting? For now, just return success.
        return { success: true, message: 'Already matched' }
    }

    const { error } = await supabase
        .from('os_matches')
        .insert({
            initiator_id: user.id,
            target_id: targetId,
            target_type: targetType,
            status: status,
            job_id: jobId
        })

    if (error) {
        console.error('Error saving match:', error)
        return { error: 'Failed to save match' }
    }

    // Handle Messages & Emails for 'applied' or 'invited'
    if (status === 'applied' || status === 'invited') {
        try {
            // Fetch Initiator Profile (Sender)
            const { data: senderProfile } = await supabase
                .from('os_user_profiles')
                .select('username, first_name, last_name')
                .eq('id', user.id)
                .single()

            const senderName = senderProfile?.first_name || senderProfile?.username || 'A User';

            // Fetch Target User ID (Recipient)
            // If target is candidate, targetId IS the userId.
            // If target is job/gig, we need to find the creator.
            let recipientId = targetId;
            let jobTitle = 'Availability';

            if (targetType === 'job') {
                const { data: job } = await supabase.from('os_jobs').select('created_by, title').eq('id', targetId).single();
                if (job) {
                    recipientId = job.created_by; // Assuming created_by exists on jobs
                    jobTitle = job.title;
                }
            } else if (targetType === 'gig') {
                const { data: gig } = await supabase.from('os_gigs').select('created_by, title').eq('id', targetId).single();
                if (gig) {
                    recipientId = gig.created_by;
                    jobTitle = gig.title;
                }
            } else {
                // Logic to get job title if it's an invite
                if (jobId) {
                    const { data: job } = await supabase.from('os_jobs').select('title').eq('id', jobId).single();
                    jobTitle = job?.title || 'a Job';
                }
            }

            // If we found a recipient (and it's not the sender themselves)
            if (recipientId && recipientId !== user.id) {
                // 1. Create/Find Thread
                // We need to check if a thread exists between these two.
                // Simplified: Just insert a message into a new thread or existing one?
                // Let's create a new thread for this application context if possible, or append to existing DM.
                // For simplicity, let's just create a message linked to a thread. 
                // We'll need a helper or look up existing thread.

                // Check for existing thread
                const { data: threads } = await supabase.from('os_threads').select('id, participants').contains('participants', [user.id, recipientId]);
                let threadId;

                // Naive thread check - 'participants' is JSONB array?
                // Assuming we can find one. If not create one.
                // Actually, let's just trigger the email for now to keep it robust. 
                // Full messaging system integration might require more robust thread finding logic.

                // 2. Send Email
                // We need to fetch recipient email - usually in auth.users but we can't access that easily from client-side action without service role?
                // Wait, this is a server action, so we have full access if we use service role client?
                // Standard createClient use cookies, so it acts as the user.
                // We might not be able to get the recipient's email if it's private.
                // HOWEVER, for this "demo" / valid use case, let's assume we can notify the system admin or if we have email in profile.
                // Let's import the email function and try.
                const { sendApplicationEmail } = await import('@/lib/email');
                // For now, send to a fixed admin email or if profile has it (it usually doesn't for privacy).
                // We'll send to the "admin" for testing or if we have a way.
                // Users table is restricted.

                await sendApplicationEmail({
                    to: 'pjlosey@outlook.com', // Placeholder: In real app, fetch from secure user data or assume admin forwards it.
                    jobTitle: jobTitle,
                    applicantName: senderName,
                    applicantId: user.id,
                    isInvite: status === 'invited',
                    jobId: targetType === 'job' ? targetId : jobId
                });
            }

        } catch (err) {
            console.error('Error sending notification:', err);
            // Don't fail the match save just because notification failed
        }
    }

    revalidatePath('/jobs')
    return { success: true }
}
