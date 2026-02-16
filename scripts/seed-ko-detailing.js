const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedKODetailing() {
    console.log('Seeding KO Detailing demo...');

    // 1. Create the organization
    const { data: org, error: orgError } = await supabase
        .from('organizations')
        .upsert({
            slug: 'ko-detailing',
            name: 'KO Detailing',
            type: 'service',
            status: 'active',
            site_enabled: true,
            site_template: 'auto_detailer',
            description: 'Professional auto detailing services that bring your vehicle back to showroom quality.',
            location: 'Peoria, IL',
            contact_email: 'contact@kodetailing.com',
            latitude: 40.6936,
            longitude: -89.5890,
            site_schema: null // Use default auto_detailer template
        }, { onConflict: 'slug' })
        .select()
        .single();

    if (orgError) {
        console.error('Error creating organization:', orgError);
        return;
    }

    console.log('Created organization:', org.id);

    // 2. Create services (based on KO Detailing price list)
    const services = [
        {
            org_id: org.id,
            name: 'Basic',
            description: 'Essential detailing package',
            price: 65,
            display_order: 1,
            features: [
                'Hand wash exterior',
                'Clay bar',
                'Protective coating to paint',
                'Clean and shine tires',
                'Vacuum interior',
                'Interior wipe down'
            ]
        },
        {
            org_id: org.id,
            name: 'Premium',
            description: 'Our most popular package',
            price: 200,
            display_order: 2,
            is_featured: true,
            features: [
                'Hand wash exterior, clay bar treatment',
                'Protective coating on paint, clean and shine tires',
                'Clean mirrors/windshield',
                'Vacuum interior, clean carpet and floor mats',
                'Detailing all interior surfaces'
            ]
        },
        {
            org_id: org.id,
            name: 'Basic+',
            description: 'Enhanced basic package',
            price: 125,
            display_order: 3,
            features: [
                'Hand wash exterior, clay bar treatment',
                'Add protective coating to paint, clean and shine tires',
                'Clean mirrors/windshield',
                'Vacuum interior',
                'Spot cleaning carpets and interior wipe down'
            ]
        }
    ];

    const { error: servicesError } = await supabase
        .from('org_services')
        .delete()
        .eq('org_id', org.id);

    const { error: insertError } = await supabase
        .from('org_services')
        .insert(services);

    if (insertError) {
        console.error('Error creating services:', insertError);
    } else {
        console.log('Created 3 services');
    }

    // 3. Add business hours (Mon-Sat, example hours)
    const hours = [
        { org_id: org.id, day_of_week: 1, open_time: '08:00', close_time: '18:00' }, // Monday
        { org_id: org.id, day_of_week: 2, open_time: '08:00', close_time: '18:00' }, // Tuesday
        { org_id: org.id, day_of_week: 3, open_time: '08:00', close_time: '18:00' }, // Wednesday
        { org_id: org.id, day_of_week: 4, open_time: '08:00', close_time: '18:00' }, // Thursday
        { org_id: org.id, day_of_week: 5, open_time: '08:00', close_time: '18:00' }, // Friday
        { org_id: org.id, day_of_week: 6, open_time: '09:00', close_time: '15:00' }, // Saturday
        { org_id: org.id, day_of_week: 0, is_closed: true } // Sunday - Closed
    ];

    await supabase.from('org_hours').delete().eq('org_id', org.id);
    const { error: hoursError } = await supabase.from('org_hours').insert(hours);

    if (hoursError) {
        console.error('Error creating hours:', hoursError);
    } else {
        console.log('Created business hours');
    }

    // 4. Add social link
    await supabase.from('org_social_links').delete().eq('org_id', org.id);
    const { error: socialError } = await supabase
        .from('org_social_links')
        .insert({
            org_id: org.id,
            platform: 'facebook',
            url: 'https://www.facebook.com/profile.php?id=61585802315775'
        });

    if (socialError) {
        console.error('Error creating social links:', socialError);
    } else {
        console.log('Created social links');
    }

    console.log('\n✅ KO Detailing demo seeded successfully!');
    console.log(`   Visit: http://localhost:3000/biz/ko-detailing`);
}

seedKODetailing();
