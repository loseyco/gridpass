require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Config
const TARGET_USERNAME = 'pjlosey';

const personalVehiclesRaw = [
    "2009 BMW 528i",
    "2021 Suzuki DRZ400s",
    "2017 Jeep Wrangler",
    "2004 Volvo S60R",
    "1990 Jeep Wrangler",
    "1986 Honda Shadow 700",
    "2015 Ford F150",
    "2015 Honda 250L",
    "1983 Honda CBX 1000",
    "2009 Honda CBR1000RR",
    "2001 BMW 325i",
    "1999 Mitsubishi Eclipse GST",
    "2001 Chevrolet 1500",
    "2000 Dodge Dakota",
    "2000 Chevrolet Tahoe",
    "1993 Honda Civic",
    "1986 Kawasaki Ninja 600 GPZ",
    "1995 Mitsubishi Eclipse GSX",
    "1995 Kawasaki ZX9R",
    "1988 Chevrolet S10",
    "1989 Plymouth Sundance",
    "2001 Honda Four 400ex",
    "1997 Honda XR100",
    "1987 Suzuki 125",
    "1997 Honda Four Trax 90",
    "1991 Yamaha 350 Warrior",
    "2001 Kawasaki 400f Quad",
    "2001 Kawasaki KX450",
    "2007 Honda 450R",
    "2017 Polaris RZR 800s"
];

const davidsonVehiclesRaw = [
    "#51 - Dayle Coyne Racing (Indycar)",
    "#15 - RLL (Indycar)",
    "Norma BMW",
    "Norma Honda",
    "Eagle SLC",
    "Eagle Boat",
    "Radical",
    "Griffith Bobs",
    "Griffith Roger",
    "Tesla P85",
    "Tesla Roadster",
    "1953 Chevrolet Corvette",
    "Ferrari LaFerrari",
    "McLaren P1",
    "McLaren Senna",
    "Electric Boat",
    "DMC DeLorean",
    "Cameron Racing",
    "Ron Baker",
    "Rearden Racing"
];

function parseVehicle(raw) {
    // Regex for "YYYY Make Model..."
    const yearMatch = raw.match(/^(\d{4})\s+(.*)$/);
    if (yearMatch) {
        const year = parseInt(yearMatch[1]);
        const rest = yearMatch[2];
        const firstSpace = rest.indexOf(' ');
        if (firstSpace === -1) {
            return { year, make: rest, model: 'Unknown' };
        }
        return {
            year,
            make: rest.substring(0, firstSpace),
            model: rest.substring(firstSpace + 1)
        };
    }

    // No year, try to guess Make from first word
    const firstSpace = raw.indexOf(' ');
    if (firstSpace !== -1) {
        return {
            year: null,
            make: raw.substring(0, firstSpace),
            model: raw.substring(firstSpace + 1)
        };
    }

    return { year: null, make: raw, model: 'Unknown' };
}

async function main() {
    console.log(`🌱 Importing Collections for user: ${TARGET_USERNAME}...`);

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
        process.exit(1);
    }
    const userId = profile.id;
    console.log(`👤 Found User: ${profile.full_name} (${userId})`);

    // 2. Create Collections
    const collectionsToCreate = [
        { name: "PJ's Personal Collection", type: 'Private', description: 'Street Legal & Recreational' },
        { name: "Davidson Collection", type: 'Racing Team', description: 'Davidson Racing & Indycar' }
    ];

    const createdCollections = {};

    for (const c of collectionsToCreate) {
        // Check if exists
        const { data: existing } = await supabase
            .from('collections')
            .select('id')
            .eq('owner_id', userId)
            .eq('name', c.name)
            .maybeSingle();

        if (existing) {
            console.log(`ℹ️ Collection '${c.name}' already exists.`);
            createdCollections[c.name] = existing.id;
        } else {
            const { data: newCol, error: createError } = await supabase
                .from('collections')
                .insert({
                    name: c.name,
                    type: c.type,
                    description: c.description,
                    owner_id: userId,
                    owner_type: 'user'
                })
                .select('id')
                .single();

            if (createError) {
                console.error(`❌ Failed to create collection '${c.name}':`, createError);
            } else {
                console.log(`✅ Created collection '${c.name}'`);
                createdCollections[c.name] = newCol.id;
            }
        }
    }

    // 3. Insert Vehicles
    async function insertVehicles(rawList, collectionName) {
        const collectionId = createdCollections[collectionName];
        if (!collectionId) return;

        const vehicles = rawList.map(raw => {
            const parsed = parseVehicle(raw);
            return {
                user_id: userId,
                collection_id: collectionId,
                year: parsed.year,
                make: parsed.make,
                model: parsed.model,
                type: 'Car', // Default
                description: raw // Keep full raw string as desc just in case
            };
        });

        const { error: insertError } = await supabase
            .from('user_vehicles')
            .insert(vehicles);

        if (insertError) {
            console.error(`❌ Error inserting vehicles for ${collectionName}:`, insertError);
        } else {
            console.log(`✅ Inserted ${vehicles.length} vehicles into '${collectionName}'`);
        }
    }

    if (createdCollections["PJ's Personal Collection"]) {
        await insertVehicles(personalVehiclesRaw, "PJ's Personal Collection");
    }

    if (createdCollections["Davidson Collection"]) {
        await insertVehicles(davidsonVehiclesRaw, "Davidson Collection");
    }

    console.log('\n✨ Import Complete!');
}

main();
