const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Config
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const INPUT_FILE = path.join(__dirname, 'master_feed_v2.json');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function cleanText(text) {
    if (!text) return '';
    return text.replace(/\n+/g, ' ').substring(0, 500); // Truncate for DB
}

// Extract listings from raw text blocks
function parseItems(sourceUrl, rawItems) {
    const listings = [];
    
    // Heuristic: Split by "Facebook Facebook" or similar delimiters if needed
    // But our v2 scraper already split them into array items (mostly)
    
    // Flatten if items is array of strings
    let textBlocks = [];
    if (Array.isArray(rawItems)) {
        rawItems.forEach(item => {
            // Further split by double newlines if it's a huge dump
            if (item.length > 1000) {
                textBlocks = textBlocks.concat(item.split(/\n{3,}/));
            } else {
                textBlocks.push(item);
            }
        });
    }

    textBlocks.forEach(text => {
        // Classify
        let type = 'job';
        if (text.match(/looking for|seeking/i)) type = 'candidate';
        if (text.match(/selling|for sale|\$/i)) type = 'sale';
        
        // Extract Title (first line usually)
        let title = text.split('\n')[0].substring(0, 80);
        if (title.includes('Facebook')) title = 'Social Post'; // Cleanup
        
        // Extract Author
        const authorMatch = text.match(/([A-Z][a-z]+ [A-Z][a-z]+)/);
        const author = authorMatch ? authorMatch[1] : 'Unknown';

        // Filter garbage
        if (text.length < 50 || text.includes('Facebook Facebook')) return;

        listings.push({
            title,
            description: cleanText(text),
            origin_author_name: author,
            origin_source: sourceUrl.includes('linkedin') ? 'linkedin' : 'facebook_group',
            origin_url: sourceUrl,
            status: 'active'
        });
    });
    
    return listings;
}

(async () => {
    console.log('🚀 Processing Master Feed...');
    
    const rawData = fs.readFileSync(INPUT_FILE, 'utf-8');
    const sources = JSON.parse(rawData);
    
    let count = 0;

    for (const source of sources) {
        const listings = parseItems(source.source, source.items);
        console.log(`Processing ${source.source}: ${listings.length} valid items.`);
        
        for (const item of listings) {
            const { error } = await supabase.from('scraped_listings').insert(item);
            if (error) console.error('Error:', error.message);
            else count++;
        }
    }

    console.log(`✅ Done! Inserted ${count} new leads.`);
})();
