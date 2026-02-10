require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const TARGET_USERNAME = 'pjlosey';

const listings = [
    {
        title: "2021 Suzuki DRZ-S",
        price: "$5,400",
        location: "Grayslake, IL",
        description: "Selling my 2021 Suzuki DR-Z400S. 3,800 miles. Clean title in hand.\nRuns perfectly. Zero mechanical issues. Ready to rip.\n\nUpgrades:\n3x3 Airbox Mod\nAftermarket Exhaust (Sounds great)\nJet Kit (tuned for the mods)\n\nCondition:\nMechanically 10/10. Starts every time.\nCosmetically 7/10. It’s a dirt bike—has a few dents in the tank and scuffs on the plastics from trail riding.\nTires at 50%.\nLocated in Grayslake, IL. No trades. Cash only.",
        image_url: "https://scontent-ord5-2.xx.fbcdn.net/v/t45.5328-4/630999799_782480284287254_7770710703580486263_n.jpg?stp=dst-jpg_p720x720_tt6&_nc_cat=104&ccb=1-7&_nc_sid=247b10&_nc_ohc=EXJDdYlAZVAQ7kNvwGi6zhR&_nc_oc=AdnHR609-bWjKiCZMQ5IzYYGth4rFSXkAJKQsZ0_Pu8GMRq8kBFp5TKtuFdWvk3qm6i1oAnb0H9YhOpC_L-TTXSK&_nc_zt=23&_nc_ht=scontent-ord5-2.xx&_nc_gid=OtV2IKe843KY1O7sj6jnzg&oh=00_AftUDk_g6bEjd-D0UZzFZ7tT5i4FUZpprbjUDfUgYzaa9w&oe=6990F52E",
        type: 'Motorcycle',
        make: 'Suzuki',
        model: 'DRZ-S',
        year: 2021
    },
    {
        title: "2009 BMW 528i",
        price: "$5,900",
        location: "Grayslake, IL",
        description: "For sale is my daily driver 2009 BMW 528i. This is the unicorn spec: RWD with the factory 6-Speed Manual transmission. A true driver's sedan.\n\nKey Features:\nMileage: 136k (Daily driven, miles will go up slightly).\nTransmission: 6-Speed Manual (Rare!).\nWheels: Upgraded OEM M-Series Wheels.\nEngine: Inline-6 N52 (Reliable, naturally aspirated).\nCondition: Good Plus. Leather interior is clean.\n\nMaintenance/Notes:\nRuns and drives perfectly. Smooth shifter, strong clutch.\nCheck Engine Light is on for a Rear O2 Sensor code (emissions only, does not affect performance/mpg).\nEnthusiast owned (I'm a motorsport engineer). Maintained properly.\n\nLocated in Grayslake, IL. Clean title in hand.\nCash only. No trades unless it's something interesting (Sim gear + Cash?).",
        image_url: "https://scontent-ord5-3.xx.fbcdn.net/v/t39.30808-6/629318112_892635653566075_2576864289504919880_n.jpg?stp=c0.296.1152.1152a_dst-jpg_s261x260_tt6&_nc_cat=110&ccb=1-7&_nc_sid=454cf4&_nc_ohc=yM8fu-xeX28Q7kNvwGYyiU-&_nc_oc=Adlnp-4wli91pP-yqFwfIfEA50NTeUb1cj6ULpz5H6ZVrBYSRDkyTG9VxbiG4z8xo1GUiar1Ks-_J6xqydqSS03W&_nc_zt=23&_nc_ht=scontent-ord5-3.xx&_nc_gid=KEPj2uWeuwfa1PElFXc9UA&oh=00_AftbjM_yY6Vx1IBwRfsrMmhWmVaVl-kebqYGYB8dkcf4Gw&oe=6990FBEE",
        type: 'Car',
        make: 'BMW',
        model: '528i',
        year: 2009
    }
];

async function main() {
    console.log(`🚀 Importing listings for user: ${TARGET_USERNAME}...`);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Missing Supabase credentials in .env.local');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Get User ID
    // Try to find by username in profiles first (if profiles table exists and has username)
    // OR just use auth.users if we had access, but we can't select from auth.users easily with user client usually.
    // The previous script used 'profiles' table. Let's assume it exists.
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
    console.log(`👤 Found User: ${profile.full_name || TARGET_USERNAME} (${userId})`);

    // 2. Insert Vehicles
    const vehiclesData = listings.map(l => ({
        user_id: userId,
        type: l.type,
        make: l.make,
        model: l.model,
        year: l.year,
        photo_url: l.image_url,
        // Append Price and Location to description since we don't have columns yet
        description: `[FOR SALE: ${l.price} - ${l.location}]\n\n${l.description}`
    }));

    const { error: insertError } = await supabase
        .from('user_vehicles')
        .insert(vehiclesData);

    if (insertError) {
        console.error('❌ Insert Error:', insertError.message);
    } else {
        console.log(`✅ Successfully inserted ${vehiclesData.length} vehicles.`);
    }

    console.log('\n✨ Import Complete!');
}

main();
