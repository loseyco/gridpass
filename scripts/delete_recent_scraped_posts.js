const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
    console.log("Deleting recent data (24h)...");

    // Get time 24 hours ago
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // 1. Get IDs of posts to delete
    const { data: posts } = await supabase
        .from('scraped_posts')
        .select('id')
        .gt('created_at', oneDayAgo);

    if (!posts || posts.length === 0) {
        console.log("No posts found to delete.");
        return;
    }

    const postIds = posts.map(p => p.id);
    console.log(`Found ${postIds.length} posts to delete.`);

    // 2. Delete Leads (and their tokens via cascade or manual if needed)
    const { data: leads } = await supabase
        .from('leads')
        .select('id')
        .in('source_post_id', postIds);

    if (leads && leads.length > 0) {
        const leadIds = leads.map(l => l.id);

        const { error: tokenError } = await supabase.from('claim_tokens').delete().in('entity_id', leadIds);
        if (tokenError) console.error("Error deleting tokens:", tokenError);

        const { error: leadError } = await supabase.from('leads').delete().in('id', leadIds);
        if (leadError) console.error("Error deleting leads:", leadError);

        console.log(`Deleted ${leadIds.length} leads.`);
    }

    // 3. Delete Jobs
    const { error: jobError } = await supabase.from('jobs').delete().in('source_post_id', postIds);
    if (jobError) console.error("Error deleting jobs:", jobError);

    // 4. Delete Posts
    const { error: postError } = await supabase
        .from('scraped_posts')
        .delete()
        .in('id', postIds);

    if (postError) {
        console.error("Error deleting posts:", postError);
    } else {
        console.log(`Deleted ${postIds.length} posts.`);
    }
}

run();
