import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { sendStewardsUpdateEmail, sendStewardsVerdictEmail } from '@/lib/email';
import { sendPushNotification } from '@/lib/push';

export async function GET(req: NextRequest) {
    // 1. Verify Cron Secret
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const supabase = createAdminClient();

    // 2. Fetch Active Incidents (Created in last 8 days, not finalized)
    // We assume 7 notifications = finalized (or handled by logic)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 8);

    const { data: incidents, error } = await supabase
        .from('os_stewards_incidents')
        .select(`
            *,
            votes:os_stewards_votes(vote_type)
        `)
        .gt('created_at', sevenDaysAgo.toISOString())
        .lt('notification_count', 8) // Stop after 7/8 notifications
        .not('user_id', 'is', null);

    if (error) {
        console.error('Cron Fetch Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!incidents || incidents.length === 0) {
        return NextResponse.json({ message: 'No incidents to update.' });
    }

    let processedRequestCount = 0;

    for (const incident of incidents) {
        const createdAt = new Date(incident.created_at);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - createdAt.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const lastSent = incident.last_notification_sent_at ? new Date(incident.last_notification_sent_at) : null;

        // Skip if sent in last 20 hours (allow some drift)
        if (lastSent && (now.getTime() - lastSent.getTime()) < (20 * 60 * 60 * 1000)) {
            continue;
        }

        // Get User Email
        const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(incident.user_id);

        if (userError || !user || !user.email) {
            console.error(`Could not find user for incident ${incident.id}`);
            continue;
        }

        // Calculate Votes
        const voteCounts = { driver_a: 0, driver_b: 0, racing_incident: 0 };
        incident.votes.forEach((v: any) => {
            //@ts-ignore
            if (v.vote_type in voteCounts) voteCounts[v.vote_type]++;
        });

        // Determine Email Type
        if (diffDays >= 7) {
            // Final Verdict
            const verdict = getVerdict(voteCounts);
            await sendStewardsVerdictEmail(user.email, incident.title, incident.id, verdict, voteCounts);

            // Push Notification for Verdict
            const { data: subscription } = await supabase
                .from('push_subscriptions')
                .select('*')
                .eq('user_id', incident.user_id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (subscription) {
                try {
                    await sendPushNotification(subscription, {
                        title: `Verdict: ${incident.title}`,
                        body: `The community has decided: ${verdict}.`,
                        url: `/sim-racing/stewards/${incident.id}`
                    });
                } catch (e) {
                    console.error('Failed to send push notification', e);
                }
            }

            // Mark finalized (e.g. set notification_count to 10 or just increment)
            await supabase.from('os_stewards_incidents').update({
                notification_count: 10,
                last_notification_sent_at: new Date().toISOString()
            }).eq('id', incident.id);

        } else if (diffDays >= 1) {
            // Daily Update
            await sendStewardsUpdateEmail(user.email, incident.title, incident.id, voteCounts);

            // Push Notification for Daily Update
            const { data: subscription } = await supabase
                .from('push_subscriptions')
                .select('*')
                .eq('user_id', incident.user_id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (subscription) {
                try {
                    await sendPushNotification(subscription, {
                        title: `New Votes: ${incident.title}`,
                        body: `See how the community is voting on your incident.`,
                        url: `/sim-racing/stewards/${incident.id}`
                    });
                } catch (e) {
                    console.error('Failed to send push notification', e);
                }
            }

            await supabase.from('os_stewards_incidents').update({
                notification_count: incident.notification_count + 1,
                last_notification_sent_at: new Date().toISOString()
            }).eq('id', incident.id);
        }

        processedRequestCount++;
    }

    return NextResponse.json({ processed: processedRequestCount });
}

function getVerdict(votes: { driver_a: number, driver_b: number, racing_incident: number }) {
    const total = votes.driver_a + votes.driver_b + votes.racing_incident;
    if (total === 0) return "No Votes Cast";

    if (votes.driver_a > votes.driver_b && votes.driver_a > votes.racing_incident) return "Driver A at Fault";
    if (votes.driver_b > votes.driver_a && votes.driver_b > votes.racing_incident) return "Driver B at Fault";
    if (votes.racing_incident > votes.driver_a && votes.racing_incident > votes.driver_b) return "Racing Incident";

    return "Undecided / Tie";
}
