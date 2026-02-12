const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixLegacyResumeSubmissions() {
    console.log('🔧 Fixing legacy resume submissions without user accounts...\n');

    // 1. Get all auth users
    const { data: { users } } = await await supabase.auth.admin.listUsers();
    const userEmails = new Set(users.map(u => u.email));

    // 2. Find all resume_leads
    const { data: allLeads, error: fetchError } = await supabase
        .from('resume_leads')
        .select('*')
        .order('created_at', { ascending: false });

    if (fetchError) {
        console.error('Error fetching resume leads:', fetchError);
        return;
    }

    // 3. Find leads that don't have a matching user account
    const legacyLeads = allLeads.filter(lead => !userEmails.has(lead.email));

    if (!legacyLeads || legacyLeads.length === 0) {
        console.log('✅ No legacy resume submissions to fix!');
        return;
    }

    console.log(`Found ${legacyLeads.length} legacy resume submissions to fix:`);
    legacyLeads.forEach(lead => {
        console.log(`  - ${lead.name} (${lead.email})`);
    });
    console.log('');

    // 4. Process each lead
    for (const lead of legacyLeads) {
        console.log(`\n🔧 Processing ${lead.name}...`);

        try {
            // Create user
            console.log('  📝 Creating user account...');
            const { data: userData, error: createError } = await supabase.auth.admin.createUser({
                email: lead.email,
                email_confirm: true,
                user_metadata: { full_name: lead.name }
            });

            if (createError) {
                console.error('  ❌ Error creating user:', createError.message);
                continue;
            }

            const userId = userData.user.id;
            console.log('  ✅ User created:', userId);

            // Generate username
            const username = lead.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000);

            // Create profile
            console.log('  📝 Creating profile...');
            const profileData = {
                id: userId,
                username: username,
                full_name: lead.name,
                bio: lead.bio || null,
                avatar_url: lead.photo_url || null,
                resume_url: lead.resume_url || null,
                driver_info: {
                    status: 'active',
                },
                logistics_info: {
                    home_airport: lead.metadata?.home_airport || ''
                },
                physical_info: {
                    helmet_size: lead.metadata?.helmet_size || ''
                },
                social_links: lead.social_links || {},
                website: lead.portfolio_url || '',
                skills: lead.metadata?.skills || [],
                location: lead.metadata?.home_airport || '',
                updated_at: new Date().toISOString(),
            };

            const { error: profileError } = await supabase
                .from('profiles')
                .upsert(profileData);

            if (profileError) {
                console.error('  ❌ Error creating profile:', profileError.message);
                continue;
            }
            console.log('  ✅ Profile created');

            // Generate claim token
            console.log('  📝 Generating access token...');
            const token = crypto.randomBytes(16).toString('hex');

            const { error: tokenError } = await supabase
                .from('claim_tokens')
                .insert({
                    token,
                    entity_type: 'lead', // Workaround for constraint
                    entity_id: userId,
                });

            if (tokenError) {
                console.error('  ❌ Error creating token:', tokenError.message);
                continue;
            }
            console.log('  ✅ Access token generated');
            console.log(`  🔗 Access URL: /u/${username}?secret=${token}`);
            console.log(`  📧 Resume lead email: ${lead.email} → User ID: ${userId}`);

        } catch (error) {
            console.error('  ❌ Unexpected error:', error.message);
        }
    }

    console.log(`\n✅ Migration complete! Processed ${legacyLeads.length} legacy submissions.`);
}

fixLegacyResumeSubmissions().catch(console.error);
