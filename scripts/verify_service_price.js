
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyService() {
    console.log('Verifying Resume Review Service...');

    const { data: service, error } = await supabase
        .from('services')
        .select('title, price')
        .ilike('title', '%Resume Review%')
        .single();

    if (error) {
        console.error('Error fetching service:', error);
    } else {
        console.log('Found Service:', service.title);
        console.log('Price:', service.price);
        if (service.price == 20) {
            console.log('SUCCESS: Price is correctly set to $20.');
        } else {
            console.log('WARNING: Price is', service.price);
        }
    }
}

verifyService();
