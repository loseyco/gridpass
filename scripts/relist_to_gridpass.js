const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRoleKey);

const USER_ID = '885eba3f-65cf-40da-809d-196be4eaba9d';

const ITEMS_TO_LIST = [
    {
        title: '2021 Suzuki drz400s',
        price: 4700,
        description: 'Great running DRZ ready for new owner. Make me an offer.',
        preferred_category: ['Cars', 'Other'],
        images: ['https://scontent-ord5-2.xx.fbcdn.net/v/t39.30808-6/475949282_9157201734346083_7020815494294432130_n.jpg?stp=dst-jpg_p720x720_tt6&_nc_cat=103&ccb=1-7&_nc_sid=92e707&_nc_ohc=y7y1X9y5y6AAX8Q1x4-&_nc_oc=Adkz8lJz7Jz8Jz8Jz8Jz8Jz8Jz8Jz8Jz8Jz8Jz8Jz8Jz8Jz8Jz8Jz8Jz8Jz8Jz8&_nc_zt=23&_nc_ht=scontent-ord5-2.xx&_nc_gid=Aw4q4q4q4q4q4q4q4q4q4q4&oh=00_AfC-C-C-C-C-C-C-C-C-C-C&oe=65C5C5C5'],
        location: 'Grayslake, IL'
    },
    {
        title: 'Jeep Rims and Tires',
        price: 450,
        description: '5 rims and tires P24575/R17 50%+ Life left. Brand new Spare.',
        preferred_category: ['Parts', 'Other'],
        images: ['https://scontent-ord5-3.xx.fbcdn.net/v/t39.84726-6/568956023_1528576548492766_2484015822557227840_n.jpg?stp=dst-jpg_p720x720_tt6&_nc_cat=110&ccb=1-7&_nc_sid=92e707&_nc_ohc=opct9b7jbtUQ7kNvwFZLmBV&_nc_oc=AdnzwuHo1VAcmZh9EuSb7YoqOUWePkS2cSI_CAyu_GIVqCrF4IVIm4GfWxk6gdwhgOPBvZ3j2AGU4GulRgSGM680&_nc_zt=14&_nc_ht=scontent-ord5-3.xx&_nc_gid=KncTfwSluKkSYvI_jHXykA&oh=00_AftAR2Ipor4wVCNvSsQ1wV6a9pH0M4WtltzoSYGrrcqkiA&oe=69908846'],
        location: 'Grayslake, IL'
    },
    {
        title: 'Jeep Tires and Rims',
        price: 450,
        description: '5 rims and tires P255/70/R18 50%+ Life left. Brand new Spare.',
        preferred_category: ['Parts', 'Other'],
        images: ['https://scontent-ord5-1.xx.fbcdn.net/v/t39.84726-6/571234864_1183114210451893_8234227656349725520_n.jpg?stp=dst-jpg_p720x720_tt6&_nc_cat=111&ccb=1-7&_nc_sid=92e707&_nc_ohc=onBhMaOQW1AQ7kNvwEoBMHY&_nc_oc=AdnZZkY_B9b19IHdf8PRqceaIFvEt2Z-qDD7U4hCstum5sfJ2WP-3WnnYNV2EXxRnpU9uwpxMpjsuyQNlo6tbcTZ&_nc_zt=14&_nc_ht=scontent-ord5-1.xx&_nc_gid=BfmkPHrBl1aSuyZGyKAKcQ&oh=00_AfvBqpErSXF4WeC0P_vqIn1yBdQ4KuC61QgPAEmeZ4fevw&oe=69906934'],
        location: 'Grayslake, IL'
    }
];

async function listItems(userId) {
    console.log(`📋 Starting to list ${ITEMS_TO_LIST.length} items for user ${userId}...`);

    for (const item of ITEMS_TO_LIST) {
        console.log(`\n👉 Processing item: ${item.title}`);

        const { data: existing } = await supabase
            .from('classifieds')
            .select('*')
            .eq('title', item.title)
            .eq('user_id', userId)
            .maybeSingle();

        if (existing) {
            console.log(`   🔁 Exists: http://localhost:3000/classifieds/${existing.id}`);
            continue;
        }

        let success = false;
        let createdId = null;

        for (const cat of item.preferred_category) {
            const { data: newItem, error: insertError } = await supabase
                .from('classifieds')
                .insert({
                    user_id: userId,
                    title: item.title,
                    description: item.description,
                    price: item.price,
                    category: cat,
                    status: 'active',
                    images: item.images,
                    contact_info: { location: item.location }
                })
                .select()
                .single();

            if (!insertError && newItem) {
                console.log(`   ✅ Success with category: '${cat}'`);
                createdId = newItem.id;
                success = true;
                break;
            } else {
                console.log(`   ⚠️ insert error for '${cat}': ${insertError.message}`);
            }
        }

        if (success) {
            console.log(`   🔗 NEW GridPass URL: http://localhost:3000/classifieds/${createdId}`);
        } else {
            console.error('   ❌ All categories failed.');
        }
    }
}

// MAIN
(async () => {
    try {
        console.log(`✅ Using ID: ${USER_ID}`);
        await listItems(USER_ID);
        console.log('✅ Done.');
    } catch (e) {
        console.error('Main Error:', e);
    }
})();
