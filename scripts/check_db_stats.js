
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });


const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkStats() {
    const { count } = await supabase
        .from('user_vehicles')
        .select('*', { count: 'exact', head: true });

    const { data: vehicles, error } = await supabase
        .from('user_vehicles')
        .select('current_value');

    if (error) {
        console.error('Error fetching vehicles:', error);
        return;
    }

    const total = (vehicles || []).reduce((sum, v) => sum + (Number(v.current_value) || 0), 0);


    console.log('Vehicle Count:', count);
    console.log('Total Value:', total);
    console.log('Sample Prices:', vehicles.slice(0, 5).map(v => v.price));
}

checkStats();
