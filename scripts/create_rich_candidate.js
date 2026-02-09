const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    console.log('🏎️  Simulating "Deep Research Agent" run...');
    console.log('🔍 Finding Candidate: "Jaden Pariat" (British F4 Driver looking for seat)...');

    // Extracted from Search Results
    const realData = {
        name: 'Jaden Pariat',
        role: 'Racing Driver',
        primary_skill: 'British F4',
        bio: '19-year-old rising talent from Shillong, India. Started karting (Meco FMSCI X30 National podium), transitioned to British F4 with Phinsys by Argenti. Invited to Ferrari Driver Academy selection. Finished 3rd in F4 Indian Championship.',
        location: 'Silverstone, UK / Shillong, India',
        avatar_url: 'https://images.unsplash.com/photo-1599839572645-5645d9471676?w=400&h=400&fit=crop', // Placeholder for now to ensure it loads
        skills: ['Formula 4', 'Single Seater', 'Karting', 'Telemetry Analysis', 'FDA Selection'],
        career_history: [
            {
                id: 'c1',
                title: 'Racing Driver',
                organization: 'Phinsys by Argenti',
                start_date: '2023',
                end_date: '2024',
                type: 'contract',
                description: 'Competed in ROKiT British F4 Championship. Rookie Cup Podium at Donington Park.',
                vehicle_info: 'Tatuus F4-T421',
                location: 'UK'
            },
            {
                id: 'c2',
                title: 'Karting Driver',
                organization: 'Meco Motorsports',
                start_date: '2020',
                end_date: '2022',
                type: 'event',
                description: 'Runner-up in Meco FMSCI X30 National Championship. First rookie from North East India to podium.',
                vehicle_info: 'X30 Senior',
                location: 'India'
            }
        ]
    };

    // Store rich data in JSONB columns if schema allows, or fallback to contact_info
    // We'll shove it into contact_info since we didn't migrate schema successfully yet
    const contactInfo = {
        email: 'jaden.pariat@example.com', // Simulate Found Email
        avatar_url: realData.avatar_url,
        bio: realData.bio,
        location: realData.location,
        career_history: realData.career_history,
        driver_info: {
            primary_discipline: 'Formula 4',
            license_class: 'International C (FIA)',
            years_experience: '4 Years'
        }
    };

    const { data: lead, error } = await supabase
        .from('leads')
        .insert({
            name: realData.name,
            role: realData.role,
            primary_skill: realData.primary_skill,
            status: 'new',
            source_link: 'https://www.fiaformula4.com/driver/jaden-pariat/',
            skills: realData.skills,
            contact_info: contactInfo // Storing the rich profile here!
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating lead:', error);
        return;
    }

    console.log('✅ Created Real-World Lead:', lead.name);

    // Create Claim Token
    const tokenString = 'claim_jaden_' + Math.random().toString(36).substring(7);

    await supabase.from('claim_tokens').insert({
        entity_type: 'lead',
        entity_id: lead.id,
        token: tokenString
    });

    console.log('\n🎯 REAL PROFILE CLAIM LINK:');
    console.log(`http://localhost:3000/claim/${tokenString}`);
}

run();
