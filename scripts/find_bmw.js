const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function findBmw() {
    const { data, error } = await supabase
        .from('vehicles')
        .select('id, name')
        .eq('name', '2009 BMW 528i')
        .single();

    if (error) {
        console.error('Error:', error);
    } else {
        console.log(`✅ Found BMW: ${data.name}`);
        console.log(`   ID: ${data.id}`);
        console.log(`   Public Link: http://localhost:3000/garage/public/${data.id}`);
    }
}

findBmw();
