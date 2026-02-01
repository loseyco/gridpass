require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase URL or Service Role Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function updateChangelog() {
    const version = 'v0.1.4';

    // Check if exists first to avoid duplicate errors if run multiple times
    const { data: existing } = await supabase
        .from('changelogs')
        .select('id')
        .eq('version', version)
        .single();

    if (existing) {
        console.log(`Changelog ${version} already exists. updating content...`);
        const { error } = await supabase
            .from('changelogs')
            .update({
                title: 'Live Analytics & Tracking',
                summary: 'Introduced the new Live Analytics dashboard for real-time monitoring and integrated Google Analytics & Microsoft Clarity for deep user insights.',
                published_at: new Date().toISOString(),
                is_public: true,
                changes: [
                    { type: "feature", text: "Added <strong>Live Analytics Dashboard</strong> in Admin Console for real-time traffic monitoring." },
                    { type: "feature", text: "Integrated <strong>Google Analytics 4</strong> for long-term traffic analysis." },
                    { type: "feature", text: "Integrated <strong>Microsoft Clarity</strong> for heatmaps and session recording." },
                    { type: "improvement", "text": "Verified PageTracker integration for accurate internal metrics." }
                ]
            })
            .eq('id', existing.id);

        if (error) {
            console.error('Error updating changelog:', error);
            process.exit(1);
        }
    } else {
        console.log(`Creating new changelog ${version}...`);
        const { error } = await supabase
            .from('changelogs')
            .insert({
                version: 'v0.1.4',
                title: 'Live Analytics & Tracking',
                summary: 'Introduced the new Live Analytics dashboard for real-time monitoring and integrated Google Analytics & Microsoft Clarity for deep user insights.',
                published_at: new Date().toISOString(),
                is_public: true,
                changes: [
                    { type: "feature", text: "Added <strong>Live Analytics Dashboard</strong> in Admin Console for real-time traffic monitoring." },
                    { type: "feature", text: "Integrated <strong>Google Analytics 4</strong> for long-term traffic analysis." },
                    { type: "feature", text: "Integrated <strong>Microsoft Clarity</strong> for heatmaps and session recording." },
                    { type: "improvement", "text": "Verified PageTracker integration for accurate internal metrics." }
                ]
            });

        if (error) {
            console.error('Error inserting changelog:', error);
            process.exit(1);
        }
    }

    console.log('Changelog updated successfully!');
}

updateChangelog();
