const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
    console.log('🔍 Checking Classifieds...');

    const { data, error } = await supabase
        .from('classifieds')
        .select('id, title, category, user_id, status')
        .limit(10); // Limit to recent

    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log(`Found ${data.length} items:`);
        data.forEach(item => {
            console.log(` - [${item.id}] ${item.title} (${item.category}) - User: ${item.user_id}`);
        });
    }
}

run();
