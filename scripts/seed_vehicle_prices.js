
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function seedValues() {
    const { data: vehicles } = await supabase.from('user_vehicles').select('id');

    // Give each vehicle a value between 50k and 150k
    for (const v of vehicles) {
        const current_value = Math.floor(Math.random() * 100000) + 50000;
        await supabase
            .from('user_vehicles')
            .update({ current_value })
            .eq('id', v.id);
    }
    console.log(`Updated ${vehicles.length} vehicles with random prices.`);
}

seedValues();
