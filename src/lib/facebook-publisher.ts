import { FacebookClient } from './facebook';
import { createClient } from '@/utils/supabase/server'; // Assuming standard util

export class FacebookPublisher {
    private fbClient: FacebookClient;
    private supabase: any; // Using 'any' for now to avoid specific client type issues without checking

    constructor(pageId: string, accessToken: string) {
        this.fbClient = new FacebookClient(pageId, accessToken);
    }

    /*
     * Initialize Supabase client inside methods where needed, or passed in constructor.
     * For cron jobs, we usually create a fresh client.
     */

    async publishPendingNews(limit: number = 5) {
        const supabase = await createClient();

        // 1. Fetch pending news
        const { data: articles, error } = await supabase
            .from('os_news_articles')
            .select('*')
            .eq('is_published_to_facebook', false)
            .order('published_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching news:', error);
            return;
        }

        if (!articles || articles.length === 0) return;

        console.log(`Found ${articles.length} news articles to publish to Facebook.`);

        for (const article of articles) {
            try {
                // Construct message
                const message = `${article.title}\n\nRead more: ${article.url}\n\n#GridPass #Motorsports`;

                // Post to FB
                const postId = await this.fbClient.postToPage(message, article.url);

                // Update DB
                await supabase
                    .from('os_news_articles')
                    .update({
                        is_published_to_facebook: true,
                        facebook_post_id: postId
                    })
                    .eq('id', article.id);

                console.log(`Published article ${article.id} to Facebook: ${postId}`);

            } catch (e: any) {
                console.error(`Failed to publish article ${article.id}:`, e.message);
            }
        }
    }

    async publishNewMembers(limit: number = 3) {
        const supabase = await createClient();

        // 1. Fetch unannounced members
        // Check if announced_to_facebook_at is NULL
        const { data: profiles, error } = await supabase
            .from('os_user_profiles')
            .select('*')
            .is('announced_to_facebook_at', null)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching new members:', error);
            return;
        }

        if (!profiles || profiles.length === 0) return;

        console.log(`Found ${profiles.length} new members to announce.`);

        for (const profile of profiles) {
            try {
                const name = profile.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : profile.username;
                const profileUrl = `https://gridpass.app/u/${profile.username}`;

                const message = `🏎️ Welcome ${name} to GridPass!\n\nCheck out their racing profile: ${profileUrl}\n\n#GridPass #NewMember #SimRacing`;

                // Post to FB
                // If they have a cover photo or avatar, maybe use that? For now, just a link post.
                const postId = await this.fbClient.postToPage(message, profileUrl);

                // Update DB
                await supabase
                    .from('os_user_profiles')
                    .update({
                        announced_to_facebook_at: new Date().toISOString(),
                        facebook_announcement_post_id: postId
                    })
                    .eq('id', profile.id);

                console.log(`Announced member ${profile.username} to Facebook: ${postId}`);

            } catch (e: any) {
                console.error(`Failed to announce member ${profile.username}:`, e.message);
            }
        }
    }
    async publishDailySummary() {
        // Use a fresh client for the cron job environment
        const supabase = await createClient();

        // 1. Fetch latest unpublished summary (created in last 24h)
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

        const { data: summaries, error } = await supabase
            .from('os_daily_summaries')
            .select('*')
            .gt('created_at', twentyFourHoursAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) {
            console.error('Error fetching daily summary:', error);
            return;
        }

        if (!summaries || summaries.length === 0) {
            console.log('No recent daily summary found to publish.');
            return;
        }

        const summary = summaries[0];

        // Check if already published (we might need a flag, or just check if we posted today? 
        // For now, let's assume the cron runs once per day and we just pick the latest.)
        // Ideally, we add a 'is_published_to_facebook' column to os_daily_summaries, but for now let's just post.

        try {
            const message = `🏁 ${summary.title}\n\n${summary.summary_snippet}\n\nRead the full update on GridPass!\n\n#GridPass #DailyRecap #Motorsports`;

            // We don't have a direct link to the summary yet (unless it's a page). 
            // Let's link to the news page for now.
            const link = "https://gridpass.app/news";

            const postId = await this.fbClient.postToPage(message, link);
            console.log(`Published Daily Summary to Facebook: ${postId}`);

        } catch (e: any) {
            console.error('Failed to publish daily summary:', e.message);
        }
    }
}
