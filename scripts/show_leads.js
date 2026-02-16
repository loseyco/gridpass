require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function showLeads() {
    console.log('🔍 Checking for new leads...');
    // Get leads created in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .gt('created_at', oneHourAgo)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching leads:', error.message);
        return;
    }

    if (leads.length === 0) {
        console.log('❌ No new leads found in the last hour.');
    } else {
        console.log(`✅ Found ${leads.length} new leads:\n`);
        leads.forEach(lead => {
            console.log(`👤 Name: ${lead.name}`);
            console.log(`   Role: ${lead.role}`);
            console.log(`   Link: ${lead.source_link || 'N/A'}`);
            if (lead.contact_info?.suggested_outreach) {
                console.log(`   📝 Outreach: "${lead.contact_info.suggested_outreach}"`);
            }
            console.log('--------------------------------------------------');
        });
    }

    // Check scraped_posts
    const { data: posts, error: postError } = await supabase
        .from('scraped_posts')
        .select('*')
        .gt('created_at', oneHourAgo);

    if (posts && posts.length > 0) {
        console.log(`\n📄 Found ${posts.length} raw scraped posts (but maybe no leads generated).`);
        // Show a sample
        console.log(`Sample Post: ${posts[0].raw_content.substring(0, 100)}...`);
    } else {
        console.log('\n❌ No raw scraped posts found either. Scraper might be failing or no new posts.');
    }
}

showLeads();
