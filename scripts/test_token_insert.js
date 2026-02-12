const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bwpmqsdykumtfusflhri.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cG1xc2R5a3VtdGZ1c2ZsaHJpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTcyMDkwNCwiZXhwIjoyMDg1Mjk2OTA0fQ.6TjsEzSU5DZBV68h11oxbsOxoCLhBNa5F2oT146D_ow';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testInsert() {
    const userId = 'd0d8daaf-7223-46e9-bf2d-08e8c5946d4e'; // Found user ID

    console.log('Testing insert for user:', userId);

    const { data, error } = await supabase
        .from('claim_tokens')
        .insert({
            token: 'test-token-' + Date.now(),
            entity_type: 'lead', // Try 'lead' to bypass check constraint
            entity_id: userId
        })
        .select();

    if (error) {
        console.error('Insert Error:', error);
    } else {
        console.log('Insert Success:', data);
    }
}

testInsert();
