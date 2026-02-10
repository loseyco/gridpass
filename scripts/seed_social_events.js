const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const EVENTS = [
    {
        title: "Track Day at Willow Springs",
        description: "Open track day for all classes. Beginners welcome in Group C.",
        start_time: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days from now
        location_name: "Willow Springs International Raceway",
        city: "Rosamond",
        state: "CA",
        type: "track_day"
    },
    {
        title: "F1 Watch Party: Monaco GP",
        description: "Come watch the race on the big screen! Breakfast burritos provided.",
        start_time: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days from now
        location_name: "The Paddock Lounge",
        city: "Austin",
        state: "TX",
        type: "watch_party"
    },
    {
        title: "24h of Lemons Tech Inspection Mixer",
        description: "Meet other teams before the race. Swap parts and stories.",
        start_time: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(), // 14 days from now
        location_name: "Thunderhill Raceway",
        city: "Willows",
        state: "CA",
        type: "social"
    },
    {
        title: "Spec Miata Wrenching Night",
        description: "Helping Joe swap his transmission before the weekend. Pizza and beer provided.",
        start_time: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days from now
        location_name: "Joe's Garage",
        city: "Los Angeles",
        state: "CA",
        type: "meetup"
    },
    {
        title: "Post-Race Drinks @ The Pub",
        description: "Celebrating a (hopefully) crash-free weekend.",
        start_time: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days from now
        location_name: "O'Malleys Pub",
        city: "Sebring",
        state: "FL",
        type: "drinks"
    }
];

async function seed() {
    console.log('🌱 Seeding Social Events...');

    let organizerId;

    // 1. Try to find 'pjlosey' first (best for demo)
    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', 'pjlosey')
        .single();

    if (profile) {
        organizerId = profile.id;
        console.log(`👤 Found 'pjlosey': ${organizerId}`);
    } else {
        console.log('⚠️ Could not find pjlosey, falling back to any user...');
        const { data: users, error: userError } = await supabase.auth.admin.listUsers();

        if (userError || !users.users.length) {
            console.error('❌ Could not find any users to assign as organizer.');
            return;
        }
        organizerId = users.users[0].id;
        console.log(`👤 Using fallback user ID: ${organizerId}`);
    }

    const eventsToInsert = EVENTS.map(e => ({
        ...e,
        organizer_id: organizerId
    }));

    const { error } = await supabase.from('social_events').insert(eventsToInsert);

    if (error) {
        console.error('❌ Failed to insert events:', error.message);
    } else {
        console.log(`✅ Added ${eventsToInsert.length} events!`);
    }

    console.log('Done!');
}

seed();
