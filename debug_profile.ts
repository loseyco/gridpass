
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    const username = 'pjlosey';

    // Get user id
    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', username)
        .single();

    if (!profile) {
        console.log('Profile not found');
        return;
    }

    console.log('User ID:', profile.id);

    // Check recommendations
    const { data: recs, error } = await supabase
        .from('recommendations')
        .select('*')
        .eq('to_user_id', profile.id);

    console.log('Recommendations count:', recs?.length);
    console.log('Recommendations statuses:', recs?.map(r => r.status));
    if (error) console.error('Recs error:', error);

    // Check vehicles
    const { data: vehicles } = await supabase
        .from('user_vehicles')
        .select('*')
        .eq('user_id', profile.id);

    console.log('Vehicles count:', vehicles?.length);

    // Check collections
    const { data: collections } = await supabase
        .from('collections')
        .select('*')
        .eq('owner_id', profile.id);

    console.log('Collections:', collections?.map(c => ({ name: c.name, is_default: c.is_default, visibility: c.visibility })));
}

checkData();
