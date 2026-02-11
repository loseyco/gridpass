const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function renameDefaults() {
    console.log('Renaming default collections...');

    // 1. Fetch all collections named "My Garage" that are owned by users
    const { data: collections, error: colsError } = await supabase
        .from('collections')
        .select('id, owner_id, name')
        .eq('name', 'My Garage')
        .eq('owner_type', 'user');

    if (colsError) {
        console.error('Error fetching collections:', colsError);
        return;
    }

    console.log(`Found ${collections.length} "My Garage" collections.`);

    for (const collection of collections) {
        // 2. Fetch User Profile to get name
        // Try 'profiles' table first (common pattern), if not, use auth admin (slow but works if no profiles table)
        // Since I don't know if 'profiles' table exists or has full_name, I'll try auth.admin.getUserById

        const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(collection.owner_id);

        if (userError || !user) {
            console.error(`User not found for collection ${collection.id} (owner: ${collection.owner_id})`);
            continue;
        }

        // Determine new name
        // Prefer: Metadata Full Name -> Metadata First Name -> Email User -> "User"
        let newName = 'Garage';
        const meta = user.user_metadata || {};

        if (meta.full_name) {
            newName = `${meta.full_name}'s Garage`;
        } else if (meta.first_name) {
            newName = `${meta.first_name}'s Garage`;
        } else if (meta.username) {
            newName = `${meta.username}'s Garage`;
        } else if (user.email) {
            const emailName = user.email.split('@')[0];
            // Capitalize first letter
            const capName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
            newName = `${capName}'s Garage`;
        }

        console.log(`Renaming "${collection.name}" -> "${newName}" (User: ${user.email})`);

        // 3. Update Name
        const { error: updateError } = await supabase
            .from('collections')
            .update({ name: newName })
            .eq('id', collection.id);

        if (updateError) {
            console.error('Failed to update:', updateError);
        }
    }
    console.log('Renaming complete.');
}

renameDefaults();
