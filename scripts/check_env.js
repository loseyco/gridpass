require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (url) {
    console.log('Supabase URL Host:', new URL(url).hostname);
} else {
    console.log('No URL found');
}
