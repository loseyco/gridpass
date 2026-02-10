require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const SEED_DATA = [
    // --- Chicago Area ---
    {
        name: 'Fall-Line Motorsports',
        type: 'shop',
        location: 'Buffalo Grove, IL',
        website: 'https://fall-linemotorsports.com',
        description: 'Premier race car preparation, Arrive & Drive, and championship winning team.',
        status: 'active'
    },
    {
        name: 'Blackdog Speed Shop',
        type: 'shop',
        location: 'Lincolnshire, IL',
        website: 'https://blackdogspeedshop.com',
        description: 'Championship-winning team constructing high-performance street and race cars.',
        status: 'active'
    },
    {
        name: 'P&L Motorsports',
        type: 'shop',
        location: 'Lisle, IL',
        website: 'https://pandlmotorsports.com',
        description: 'Top Subaru performance shop offering custom fabrication, engine building, and tuning.',
        status: 'active'
    },
    {
        name: 'Hochman Fabrication & Speed',
        type: 'shop',
        location: 'Wheeling, IL',
        website: 'https://hochmanfabricationspeed.com',
        description: 'Race car maintenance, custom builds, roll cages, and exhaust fabrication.',
        status: 'active'
    },
    {
        name: 'RCautoworks',
        type: 'shop',
        location: 'Bridgeview, IL',
        website: 'https://rcautoworks.com',
        description: 'Specializing in custom fabrication, dyno tuning, and race prep.',
        status: 'active'
    },
    {
        name: 'SCCA Chicago Region',
        type: 'club',
        location: 'Chicago, IL',
        website: 'https://scca-chicago.com',
        description: 'Organizes amateur racing, autocross, and track events in the Chicago area.',
        status: 'active'
    },

    // --- Autobahn Country Club (Joliet, IL) ---
    {
        name: 'Autobahn Country Club',
        type: 'track',
        location: 'Joliet, IL',
        website: 'https://autobahncc.com',
        description: 'Premier motorsports club and track facility with member racing series.',
        status: 'active'
    },
    {
        name: 'Team Stradale',
        type: 'shop',
        location: 'Joliet, IL (Autobahn)',
        website: 'https://teamstradale.com',
        description: 'Radical Motorsport dealer, driving school, and full race support at Autobahn.',
        status: 'active'
    },
    {
        name: 'Eurosport Racing',
        type: 'shop',
        location: 'Joliet, IL (Autobahn)',
        website: 'https://eurosportporsche.com',
        description: 'Porsche specialists offering race car builds, support, and engine development.',
        status: 'active'
    },
    {
        name: 'Havoc Motorsport',
        type: 'team',
        location: 'Joliet, IL (Autobahn)',
        website: 'https://autobahncc.com/services',
        description: 'Full-service prep shop specializing in Formula Mazda and Ligier F3.',
        status: 'active'
    },

    // --- Road America (Elkhart Lake, WI) ---
    {
        name: 'Road America',
        type: 'track',
        location: 'Elkhart Lake, WI',
        website: 'https://roadamerica.com',
        description: 'Iconic 4-mile road course hosting IndyCar, IMSA, and club racing.',
        status: 'active'
    },
    {
        name: 'Wolf Motorsports',
        type: 'shop',
        location: 'Elkhart Lake, WI',
        website: 'https://wolfmotorsport.com',
        description: 'Race car preparation, setup analysis, shock dyno services, and trackside support.',
        status: 'active'
    },
    {
        name: 'Kemmel Design',
        type: 'service',
        location: 'Elkhart Lake, WI',
        website: 'https://kemmeldesign.com',
        description: 'Motorsports graphics, wraps, and livery design.',
        status: 'active'
    },

    // --- Blackhawk Farms (South Beloit, IL) ---
    {
        name: 'Blackhawk Farms Raceway',
        type: 'track',
        location: 'South Beloit, IL',
        website: 'https://blackhawkfarms.com',
        description: '1.95-mile road course favorite for club racing and track days.',
        status: 'active'
    },
    {
        name: 'Advanced Autosports',
        type: 'shop',
        location: 'Beloit, WI',
        website: 'https://advanced-autosports.com',
        description: 'Spec Miata authority offering parts, builds, rentals, and full race prep.',
        status: 'active'
    },
    {
        name: 'Elite Autosport',
        type: 'shop',
        location: 'Woodstock, IL',
        website: 'https://eliteautosport.com',
        description: 'Spec Racer Ford (SRF) experts offering rentals, prep, and sales.',
        status: 'active'
    },

    // --- Gingerman Raceway (South Haven, MI) ---
    {
        name: 'Gingerman Raceway',
        type: 'track',
        location: 'South Haven, MI',
        website: 'https://gingermanraceway.com',
        description: 'Safe and technical road course popular for testing and club racing.',
        status: 'active'
    },
    {
        name: 'Trackside Custom Works',
        type: 'shop',
        location: 'South Haven, MI',
        website: 'https://tracksidecustomworks.com',
        description: 'Specializing in custom builds, restoration, and performance upgrades.',
        status: 'active'
    },

    // --- National / Other ---
    {
        name: 'Andretti Global',
        type: 'team',
        location: 'Indianapolis, IN',
        website: 'https://andrettiglobal.com',
        description: 'Championship winning IndyCar, Formula E, and IMSA team.',
        status: 'active'
    },
    {
        name: 'Chip Ganassi Racing',
        type: 'team',
        location: 'Indianapolis, IN',
        website: 'https://chipganassiracing.com',
        description: 'Multi-discipline championship race team.',
        status: 'active'
    }
];

async function seedOrganizations() {
    console.log('🌱 Seeding organizations...');

    for (const org of SEED_DATA) {
        // Check if exists
        const { data: existing } = await supabase
            .from('organizations')
            .select('id')
            .eq('name', org.name)
            .single();

        if (existing) {
            console.log(`⚠️  Skipping ${org.name} (already exists)`);
            continue;
        }

        const { error } = await supabase
            .from('organizations')
            .insert(org);

        if (error) {
            console.error(`❌ Failed to insert ${org.name}:`, error.message);
        } else {
            console.log(`✅ Inserted: ${org.name}`);
        }
    }

    console.log('🏁 Seeding complete!');
}

seedOrganizations();
