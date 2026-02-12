import 'server-only';
import { createClient } from '@/utils/supabase/server';
import { headers } from 'next/headers';

/**
 * Standardized event types for consistent querying.
 */
export type AnalyticsEventType =
    | 'auth.signup'
    | 'auth.login'
    | 'auth.logout'
    | 'auth.password_reset'
    | 'auth.email_change'
    | 'profile.update'
    | 'profile.avatar_update'
    | 'profile.social_link_added'
    | 'car.created'
    | 'car.updated'
    | 'car.deleted'
    | 'setup.uploaded'
    | 'setup.deleted'
    | 'team.created'
    | 'team.updated'
    | 'team.member_invited'
    | 'team.member_removed'
    | 'job.posted'
    | 'job.updated'
    | 'job.application_received'
    | 'feedback.submitted'
    | 'error.critical'
    | 'page_view' // Maintained for compatibility
    | string; // Allow flexibility for ad-hoc events

/**
 * Log a user activity or system event to the database.
 * This function captures request metadata (IP, UA) automatically.
 * 
 * @param eventType - The type of event (use specific dots notation, e.g., 'car.created')
 * @param details - JSON object with event-specific details
 * @param path - Optional path context
 * @param forceUserId - Optional user ID override (useful for 'signup' where auth context might be fresh)
 */
export async function logActivity(
    eventType: AnalyticsEventType,
    details: Record<string, any> = {},
    path: string = '',
    forceUserId?: string
) {
    try {
        const supabase = await createClient();

        // 2. Capture Metadata
        const headerStore = await headers();

        // Resolve IP: Prioritize details.ip, then x-forwarded-for (first IP), then x-real-ip
        let ip = details.ip;
        if (!ip || ip === 'unknown') {
            const forwardedFor = headerStore.get('x-forwarded-for');
            if (forwardedFor) {
                ip = forwardedFor.split(',')[0].trim();
            } else {
                ip = headerStore.get('x-real-ip') || 'unknown';
            }
        }

        // FILTER: Ignore Localhost
        if (ip === '127.0.0.1' || ip === '::1') {
            return; // Silently skip logging
        }

        // 1. Resolve User (and check filter)
        let userId = forceUserId;
        if (!userId) {
            const { data: { user } } = await supabase.auth.getUser();

            // FILTER: Ignore specific users (e.g. Admin)
            if (user?.email === 'pjlosey@outlook.com') {
                return; // Silently skip logging
            }

            userId = user?.id;
        }

        const country = headerStore.get('x-vercel-ip-country') || 'unknown';
        const city = headerStore.get('x-vercel-ip-city') || 'unknown';
        const ua = headerStore.get('user-agent') || 'unknown';

        // 3. Detect Device Context
        let device_type = 'desktop';
        if (/mobile/i.test(ua)) device_type = 'mobile';
        if (/ipad|tablet/i.test(ua)) device_type = 'tablet';

        // 4. Construct Metadata
        const meta = {
            ...details,
            ip,
            country,
            city,
            user_agent: ua,
            device_type
        };

        // 5. Fire and Forget Insert
        // We do not await this to prevent blocking the main request flow unless critical
        // However, in server actions, we usually want to ensure it fires.
        const { error } = await supabase.from('analytics_events').insert({
            event_type: eventType,
            user_id: userId || null, // Allow anonymous logging if needed
            path: path || headerStore.get('referer') || '/',
            meta
        });

        if (error) {
            console.error('[Analytics] Failed to insert event:', error.message);
        }

    } catch (err) {
        console.error('[Analytics] Critical failure in logActivity:', err);
        // Do not throw, effectively swallowing the error so we don't break the user flow
    }
}
