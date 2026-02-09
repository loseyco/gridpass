require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const TARGET_USERNAME = 'pjlosey';

async function main() {
    console.log('🧹 Starting Data Cleanup...');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Missing Supabase credentials');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Get User ID
    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', TARGET_USERNAME)
        .single();

    if (!profile) {
        console.error('❌ User not found');
        process.exit(1);
    }

    // 2. Remove Sample Vehicles
    const vehiclesToRemove = ['SimLab', 'Mazda', 'Featherlite'];
    const { error: vError, count: vCount } = await supabase
        .from('user_vehicles')
        .delete({ count: 'exact' })
        .eq('user_id', profile.id)
        .in('make', vehiclesToRemove);

    if (vError) console.error('Error deleting vehicles:', vError.message);
    else console.log(`✅ Removed ${vCount || 0} sample vehicles.`);

    // 3. Remove Sample Tools
    const toolsToRemove = ['Snap-on', 'Intercomp', 'Longacre'];
    const { error: tError, count: tCount } = await supabase
        .from('user_tools')
        .delete({ count: 'exact' })
        .eq('user_id', profile.id)
        .in('brand', toolsToRemove);

    if (tError) console.error('Error deleting tools:', tError.message);
    else console.log(`✅ Removed ${tCount || 0} sample tools.`);

    // 4. Remove Test Lead ('Stig Cousin')
    const { error: lError, count: lCount } = await supabase
        .from('leads')
        .delete({ count: 'exact' })
        .eq('name', 'Stig Cousin');

    if (lError) console.error('Error deleting test lead:', lError.message);
    else console.log(`✅ Removed ${lCount || 0} test lead(s).`);

    console.log('✨ Cleanup Verification Complete.');
}

main();
