
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bwpmqsdykumtfusflhri.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cG1xc2R5a3VtdGZ1c2ZsaHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MjA5MDQsImV4cCI6MjA4NTI5NjkwNH0.VLnkH0cYZMQHuqUo8ZuBT3-0a30PM8evtfRXT8Tre40';

async function verify() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // 1. Get Profile ID
    const { data: profile, error: pError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('username', 'pjlosey')
        .single();

    if (pError) {
        console.error("Profile Fetch Error:", pError);
        return;
    }
    console.log("Profile Found:", profile);

    // 2. Get Roles
    const { data: roles, error: rError } = await supabase
        .from('roles')
        .select('*')
        .eq('user_id', profile.id);

    if (rError) {
        console.error("Roles Fetch Error:", rError);
    } else {
        console.log("Roles Found:", roles);
    }
}

verify();
