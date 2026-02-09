require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Config
const TARGET_USERNAME = 'pjlosey';

async function main() {
    console.log(`🌱 Seeding Garage for user: ${TARGET_USERNAME}...`);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Missing Supabase credentials in .env.local');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Get User ID
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('username', TARGET_USERNAME)
        .single();

    if (error || !profile) {
        console.error(`❌ Could not find profile for username: ${TARGET_USERNAME}`);
        console.error(error);
        process.exit(1);
    }
    const userId = profile.id;
    console.log(`👤 Found User: ${profile.full_name} (${userId})`);

    // 2. Insert Vehicles
    const vehicles = [
        {
            user_id: userId,
            type: 'Sim Rig',
            make: 'SimLab',
            model: 'P1-X Pro',
            year: 2024,
            description: 'Fanatec DD2, Heusinkveld Pedals, Triple 32" Monitors',
            photo_url: 'https://images.unsplash.com/photo-1629814404077-80927f872584?q=80&w=2070&auto=format&fit=crop'
        },
        {
            user_id: userId,
            type: 'Race Car',
            make: 'Mazda',
            model: 'MX-5 Miata',
            year: 1999,
            description: 'Spec Miata Build, SM Suspension, freshly rebuilt 1.8L',
            photo_url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=2070&auto=format&fit=crop'
        },
        {
            user_id: userId,
            type: 'Trailer',
            make: 'Featherlite',
            model: '24ft Enclosed',
            year: 2018,
            description: 'Tire rack, workbench, generator included',
            photo_url: 'https://images.unsplash.com/photo-1566008885218-90abf9200ddb?q=80&w=1932&auto=format&fit=crop'
        }
    ];

    const { error: vehicleError } = await supabase
        .from('user_vehicles')
        .insert(vehicles);

    if (vehicleError) {
        console.error('❌ Vehicle Insert Error:', vehicleError.message);
    } else {
        console.log(`✅ Inserted ${vehicles.length} vehicles.`);
    }

    // 3. Insert Tools
    const tools = [
        {
            user_id: userId,
            name: 'Generic Torque Wrench',
            brand: 'Snap-on',
            category: 'Hand Tools',
            description: 'Digital 1/2" drive, 12-250 ft-lbs'
        },
        {
            user_id: userId,
            name: 'Corner Scales',
            brand: 'Intercomp',
            category: 'Setup Equipment',
            description: 'Wireless pad system, 1500lb per pad capacity'
        },
        {
            user_id: userId,
            name: 'Tire Pyrometer',
            brand: 'Longacre',
            category: 'Setup Equipment',
            description: 'Probe type with memory function'
        }
    ];

    const { error: toolError } = await supabase
        .from('user_tools')
        .insert(tools);

    if (toolError) {
        console.error('❌ Tool Insert Error:', toolError.message);
    } else {
        console.log(`✅ Inserted ${tools.length} tools.`);
    }

    console.log('\n✨ Garage Seeding Complete!');
}

main();
