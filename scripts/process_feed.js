const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Config
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const INPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'facebook_feed.json');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper to extract data from raw text using regex (Basic NLP)
function extractJobDetails(text) {
    let type = 'job'; // Default
    if (text.toLowerCase().includes('looking for work') || text.toLowerCase().includes('seeking')) {
        // It might be a candidate if "I am seeking"
        if (text.match(/I am seeking|I am looking/i)) {
            type = 'candidate';
        }
    }
    if (text.toLowerCase().includes('for sale')) type = 'sale';

    // Simple extraction heuristics
    const titleMatch = text.match(/^(.+?)\n/);
    const title = titleMatch ? titleMatch[1].substring(0, 100) : 'New Opportunity';
    
    // Attempt to find author (Facebook scrape format: "Author Name\nDate...")
    // This is brittle but works for the current scraper output
    const authorMatch = text.match(/^([A-Z][a-z]+ [A-Z][a-z]+)/);
    const author = authorMatch ? authorMatch[1] : 'Unknown User';

    return {
        type,
        title,
        description: text,
        origin_author_name: author,
        status: 'active'
    };
}

(async () => {
    console.log('🚀 Processing Feed...');
    
    if (!fs.existsSync(INPUT_FILE)) {
        console.error('❌ Input file not found:', INPUT_FILE);
        process.exit(1);
    }

    const rawData = fs.readFileSync(INPUT_FILE, 'utf-8');
    const posts = JSON.parse(rawData);
    
    console.log(`found ${posts.length} posts.`);

    let jobsCount = 0;
    let candidatesCount = 0;

    for (const post of posts) {
        const details = extractJobDetails(post.text);
        
        if (details.type === 'candidate') {
            // Insert into Shadow Profiles
            const { error } = await supabase.from('shadow_profiles').insert({
                full_name: details.origin_author_name,
                experience_summary: post.text,
                origin_source: 'facebook_group',
                status: 'unclaimed'
            });
            if (error) console.error('Error inserting candidate:', error.message);
            else candidatesCount++;

        } else {
            // Insert into Listings (Jobs/Gigs)
            const { error } = await supabase.from('listings').insert({
                title: details.title, // We'll refine this with LLM later
                description: post.text,
                type: 'job', // defaulting to job for now
                origin_source: 'facebook_group',
                origin_author_name: details.origin_author_name,
                status: 'active'
            });
            if (error) console.error('Error inserting listing:', error.message);
            else jobsCount++;
        }
    }

    console.log(`✅ Done! Imported ${jobsCount} jobs and ${candidatesCount} candidates.`);
})();
