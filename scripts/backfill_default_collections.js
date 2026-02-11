const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function backfill() {
    console.log('Starting backfill of default collections...');

    // 1. Fetch all users
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
        console.error('Error fetching users:', usersError);
        return;
    }

    console.log(`Found ${users.length} users.`);

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
        // 2. Check collections for this user
        const { data: collections, error: colsError } = await supabase
            .from('collections')
            .select('*')
            .eq('owner_id', user.id)
            .eq('owner_type', 'user')
            .order('created_at', { ascending: true });

        if (colsError) {
            console.error(`Error checking collections for user ${user.id}:`, colsError);
            continue;
        }

        if (collections.length === 0) {
            // Case A: User has NO collections. Create "My Garage".
            const { error: insertError } = await supabase
                .from('collections')
                .insert({
                    owner_id: user.id,
                    owner_type: 'user',
                    name: 'My Garage',
                    description: 'My default personal collection.',
                    visibility: 'Public',
                    type: 'Private', // 'Private' is a type option in our enum, confusingly.
                    is_default: true,
                    location: 'Unknown'
                });

            if (insertError) {
                console.error(`Failed to create collection for user ${user.id}:`, insertError);
            } else {
                console.log(`[CREATED] "My Garage" for user ${user.email} (${user.id})`);
                createdCount++;
            }
        } else {
            // Case B: User HAS collections. Ensure one is default.
            const hasDefault = collections.some(c => c.is_default);

            if (!hasDefault) {
                // Mark the oldest one (first in our sorted array) as default
                const oldest = collections[0];
                const { error: updateError } = await supabase
                    .from('collections')
                    .update({ is_default: true })
                    .eq('id', oldest.id);

                if (updateError) {
                    console.error(`Failed to set default for user ${user.id}:`, updateError);
                } else {
                    console.log(`[UPDATED] Set "${oldest.name}" as default for user ${user.email}`);
                    updatedCount++;
                }
            } else {
                skippedCount++;
            }
        }
    }

    console.log('\nBackfill Complete.');
    console.log(`Created: ${createdCount}`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Skipped (Already OK): ${skippedCount}`);
}

backfill();
