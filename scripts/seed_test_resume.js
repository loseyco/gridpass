require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedResume() {
    const uniqueId = Math.floor(Math.random() * 10000);
    const email = 'loseyp@gmail.com';

    // 1. Create Resume Lead
    const { data, error } = await supabase
        .from('resume_leads')
        .insert([{
            name: 'Patrick Losey (Test)',
            email: email,
            phone: '555-0199',
            job_title: 'Test Driver',
            experience_years: '5-10',
            bio: 'This is a test resume generated for flow verification.',
            status: 'new',
            payment_status: 'unpaid', // Start unpaid
            metadata: {
                home_airport: 'SFO',
                helmet_size: 'L',
                looking_for: 'Full Time',
                salary_expectations: '$1000/day',
                skills: ['Testing', 'Debugging']
            }
        }])
        .select()
        .single();

    if (error) {
        console.error('Error seeding resume:', error);
        return;
    }

    console.log('Created Resume Lead:', data.id);

    // 2. Create Shadow Profile (Leads) - mimicking submitResumeLead logic
    // We need this because ResumeTools checks for shadowLead to enable "Convert"
    // and to attach the claim token to.
    const leadData = {
        name: data.name,
        role: data.job_title,
        source: 'resume_builder',
        contact_info: {
            email: data.email,
            username: `test-user-${uniqueId}`,
            // ... minimal other fields
        },
        status: 'new'
    };

    const { data: shadowLead, error: shadowError } = await supabase
        .from('leads')
        .insert([leadData])
        .select()
        .single();

    if (shadowError) {
        console.error('Error checking shadow lead (might duplicate):', shadowError);
    } else {
        console.log('Created Shadow Lead:', shadowLead.id);
    }
}

seedResume();
