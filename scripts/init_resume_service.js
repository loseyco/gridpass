
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function initService() {
    console.log('Initializing Resume Review Service...');

    // check if it exists
    const { data: existing } = await supabase
        .from('services')
        .select('*')
        .ilike('title', '%Resume Review%')
        .single();

    if (existing) {
        console.log('Service already exists:', existing.title, 'Price:', existing.price);
        // Update price to 20 if user requested
        const { error } = await supabase
            .from('services')
            .update({ price: 20 })
            .eq('id', existing.id);

        if (error) console.error('Error updating price:', error);
        else console.log('Updated price to $20');

        return;
    }

    // Insert new
    // check for a user to assign to (admin?)
    // For now we'll just pick the first user or hardcode if we knew an ID. 
    // Actually services table has user_id not null.

    // Let's get a user.
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const admin = users.find(u => u.email?.includes('pjlos') || u.email?.includes('admin')) || users[0];

    if (!admin) {
        console.error('No users found to assign service to.');
        return;
    }

    const { data, error } = await supabase
        .from('services')
        .insert([{
            user_id: admin.id,
            title: 'Resume Review & Consultation',
            description: 'Professional review of your racing resume.',
            price: 20,
            currency: 'USD',
            category: 'Consultation',
            tags: ['resume', 'career'],
            is_active: true
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creating service:', error);
    } else {
        console.log('Created service:', data);
    }
}

initService();
