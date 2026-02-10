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
    const version = 'v0.3.0';

    const { data: existing } = await supabase
        .from('changelogs')
        .select('id')
        .eq('version', version)
        .single();

    const changelogData = {
        version: version,
        title: 'Community & Garage Expansion',
        summary: 'Major update introducing the Community Feedback system, Racing Network for finding heavy hitters in the industry, and the new Team Build Tracker for collaborative garage projects.',
        published_at: new Date().toISOString(),
        is_public: true,
        changes: [
            { type: "feature", text: "<strong>Feedback System:</strong> Added a global feedback widget and admin dashboard to collect and manage user feedback." },
            { type: "feature", text: "<strong>Racing Network:</strong> Launched a directory of racing industry entities (Deep Seek for tracks, shops, teams) to help users find services and side work." },
            { type: "feature", text: "<strong>Team Build Tracker:</strong> Introduced project management tools for garage vehicles, allowing teams to track tasks and parts." },
            { type: "feature", text: "<strong>Service Inquiries:</strong> Added a dashboard for managing service inquiries and communicating with potential clients." },
            { type: "feature", text: "<strong>Resume Builder:</strong> Automated payment links and notifications for the resume building service." },
            { type: "feature", text: "<strong>Garage Sale:</strong> Added functionality to mark vehicles for sale and share them on Facebook." },
            { type: "feature", text: "<strong>Social Events:</strong> Added 'Grid Pass After Dark' social events feature." },
            { type: "improvement", text: "<strong>Admin Improvements:</strong> Refactored the features page and added mobile responsiveness." }
        ]
    };

    if (existing) {
        console.log(`Changelog ${version} already exists. Updating content...`);
        const { error } = await supabase
            .from('changelogs')
            .update(changelogData)
            .eq('id', existing.id);

        if (error) {
            console.error('Error updating changelog:', error);
            process.exit(1);
        }
    } else {
        console.log(`Creating new changelog ${version}...`);
        const { error } = await supabase
            .from('changelogs')
            .insert(changelogData);

        if (error) {
            console.error('Error inserting changelog:', error);
            process.exit(1);
        }
    }

    console.log('Changelog updated successfully!');
}

updateChangelog();
