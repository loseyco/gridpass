const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRoleKey);

const USER_ID = '885eba3f-65cf-40da-809d-196be4eaba9d';
const EMAIL = 'pjlosey@outlook.com';

async function run() {
    console.log(`Updating contact info for user ${USER_ID}...`);

    // Fetch items
    const { data: items, error } = await supabase
        .from('classifieds')
        .select('*')
        .eq('user_id', USER_ID);

    if (error) {
        console.error('Error fetching items:', error);
        return;
    }

    console.log(`Found ${items.length} items to update.`);

    for (const item of items) {
        const currentContact = item.contact_info || {};
        const newContact = {
            ...currentContact,
            email: EMAIL // Add email
        };

        const { error: updateError } = await supabase
            .from('classifieds')
            .update({ contact_info: newContact })
            .eq('id', item.id);

        if (updateError) {
            console.error(`❌ Failed to update item ${item.title}:`, updateError.message);
        } else {
            console.log(`✅ Updated ${item.title} with email ${EMAIL}`);
        }
    }
}

run();
