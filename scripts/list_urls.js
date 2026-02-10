const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
    const { data } = await supabase
        .from('classifieds')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

    console.log('--- URL LIST ---');
    data.forEach(item => {
        console.log(`- ${item.title}: http://localhost:3000/classifieds/${item.id}`);
    });
    console.log('--- END LIST ---');
}

run();
