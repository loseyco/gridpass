
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Use anon key for read if public, or service role if needed. Using Service Role for reliability.
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Actually we need service role to read if RLS blocks anon? 
// But os_news_sources might be public read. 
// Let's try with what we have.

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function check() {
    console.log('Checking news source timestamps...');
    const { data, error } = await supabase
        .from('os_news_sources')
        .select('name, last_scraped_at')
        .eq('enabled', true);

    if (error) {
        console.error('Error fetching sources:', error);
        return;
    }

    if (!data || data.length === 0) {
        console.log('No enabled news sources found.');
        return;
    }

    console.log('Found sources:', JSON.stringify(data, null, 2));
}

check();
