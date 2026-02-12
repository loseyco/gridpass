import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkResumeLeads() {
    const { data, error } = await supabaseAdmin
        .from('resume_leads')
        .select('id, email, name, payment_status, user_id, stripe_payment_intent_id, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('\n📋 Latest Resume Leads:');
    console.log(JSON.stringify(data, null, 2));
}

checkResumeLeads();
