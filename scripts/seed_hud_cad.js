
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function seedHudCad() {
    console.log('🚀 Seeding HUD CAD Example...');

    const email = 'jack@hudcad.com';
    const password = 'password123'; // Default password for demo
    const username = 'hudcad_jack';

    // 1. Check if user exists, or create
    let userId;
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    const existingUser = users.find(u => u.email === email);

    if (existingUser) {
        console.log('✅ User already exists:', existingUser.id);
        userId = existingUser.id;
    } else {
        console.log('creating user...');
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                username,
                full_name: 'Jack Hudson'
            }
        });

        if (createError) {
            console.error('❌ Failed to create user:', createError);
            return;
        }
        userId = newUser.user.id;
        console.log('✅ Created new user:', userId);
    }

    // 2. Upsert Profile
    const profileData = {
        id: userId,
        username,
        full_name: 'Jack Hudson',
        avatar_url: 'https://scontent-ord5-2.xx.fbcdn.net/v/t39.30808-1/471600168_9307130955966314_8885416236071601239_n.jpg?stp=cp0_dst-jpg_s32x32_tt6&_nc_cat=105&ccb=1-7&_nc_sid=e99d92&_nc_ohc=NrT7xUDYxcQQ7kNvwHxFiZO&_nc_oc=AdllTc4L-8HxO_Gi5yIB9uJDH64tDkduvSDBAesThueoT6P_48kilhNRUyuFwjxxnxG7TN8dx362IVPUv5Vo79ci&_nc_zt=24&_nc_ht=scontent-ord5-2.xx&_nc_gid=_Yx-oIWRsHIv5oFAReR62w&oh=00_AfvwSs5jS4w27m1scuSOfAcdb7MZjgt4YdUN1cfCDoAhUw&oe=698FF077', // Placeholder or use one from recent cache if available
        bio: "Freelance Design Engineer based in Bedfordshire. Specializing in 3D CAD & complex surface modelling. B.Eng in Motorsport Technology with over 10 years of industry experience.",
        location: 'Bedfordshire, UK',
        website: 'https://hudcad.com',
        role: 'member', // Valid roles: member, user, admin, founder
        social_links: {
            email: 'JACK@HUDCAD.COM',
            facebook: 'https://facebook.com/hudcad'
        },
        skills: ['CAD', 'SolidWorks', '3D Modelling', 'Reverse Engineering', 'Motorsport Design']
    };

    const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' });

    if (profileError) {
        console.error('❌ Failed to upsert profile:', profileError);
    } else {
        console.log('✅ Profile updated.');
    }

    // 3. Upsert Service
    // Check if service exists for this user to avoid duplicates on re-run
    const { data: existingServices } = await supabase
        .from('user_services')
        .select('id')
        .eq('user_id', userId)
        .eq('title', 'Motorsport CAD & Engineering Design');

    if (existingServices && existingServices.length > 0) {
        console.log('ℹ️ Service already exists, skipping creation.');
    } else {
        const serviceData = {
            user_id: userId,
            title: 'Motorsport CAD & Engineering Design',
            description: "I offer a wide selection of computer aided design based services to help bring your ideas or design challenges into reality. \n\nServices include:\n- 3D Modelling\n- Technical Drawing\n- Product Design\n- Reverse Engineering\n- Fixture/Jig Design\n- Rendering & Animation\n\nExperienced with professional race teams and one-off personal vehicle builds.",
            price: 65, // Assumed hourly rate
            currency: 'USD',
            unit: 'hourly',
            category: 'Engineering',
            tags: ['CAD', 'Design', 'Engineering', '3D Modelling', 'Reverse Engineering'],
            is_active: true,
            photo_url: 'https://placehold.co/600x400/1a1a1a/ffffff?text=HUD+CAD+Services' // Placeholder for service image
        };

        const { error: serviceError } = await supabase
            .from('user_services')
            .insert(serviceData);

        if (serviceError) {
            console.error('❌ Failed to create service:', serviceError);
        } else {
            console.log('✅ Service created: Motorsport CAD & Engineering Design');
        }
    }

    console.log('🎉 HUD CAD Seed Complete!');
}

seedHudCad();
