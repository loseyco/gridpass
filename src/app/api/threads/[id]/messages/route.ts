
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { sendSMSNotification } from '@/lib/sms';
// import { sendPushNotification } from '@/lib/push'; // Uncomment when push is ready

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const { id: threadId } = await params;

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const { data, error } = await supabase
            .from('os_messages')
            .select('*')
            .eq('thread_id', threadId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        return NextResponse.json({ success: true, data }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const { id: threadId } = await params;

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const { content } = await request.json();
        if (!content) return NextResponse.json({ success: false, error: 'Content required' }, { status: 400 });

        // Insert message
        const { data: message, error } = await supabase
            .from('os_messages')
            .insert({
                thread_id: threadId,
                sender_id: user.id,
                content
            })
            .select()
            .single();

        if (error) throw error;

        // --- Notification Logic ---
        // 1. Get thread participants to find recipient
        const { data: thread } = await supabase
            .from('os_threads')
            .select('participants')
            .eq('id', threadId)
            .single();

        if (thread) {
            const recipientId = thread.participants.find((p: string) => p !== user.id);
            if (recipientId) {
                // 2. Get recipient's phone/email
                // Try grabbing from public.users or metadata
                // For now, let's look at profiles or metadata if accessible from server context
                // Note: We might need admin client to read protected user data if RLS blocks it.
                // Assuming profiles table has phone for now or we use admin.

                // For MVP: Check User Metadata from Auth Admin (requires Service Role) or just Profiles if we added phone there.
                // Let's assume we can get it from 'profiles' if public, OR we use Admin client.
                // PROCEEDING with Admin Client for Notifications to ensure we get the phone number.

                const { createAdminClient } = await import('@/utils/supabase/admin');
                const adminSupabase = createAdminClient();

                const { data: recipientData } = await adminSupabase.auth.admin.getUserById(recipientId);
                const recipientUser = recipientData?.user;

                if (recipientUser) {
                    const phone = recipientUser.phone || recipientUser.user_metadata?.phone;

                    if (phone) {
                        // Send SMS
                        const smsResult = await sendSMSNotification({
                            to: phone,
                            message: `GridPass: New message from ${user.email}: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"\nReply at: https://gridpass.app/messages`
                        });
                        console.log(`SMS Notification result for ${recipientId}:`, smsResult);
                    } else {
                        console.log(`No phone number found for user ${recipientId}. SMS skipped.`);
                    }

                    // TODO: Push Notification Trigger here
                    // const pushSub = await ...
                    // await sendPushNotification(...)
                }
            }
        }

        return NextResponse.json({ success: true, data: message }, { status: 201 });

    } catch (error: any) {
        console.error("Message Send Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 409 });
    }
}
