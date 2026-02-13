
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    },
    db: {
        schema: 'public'
    }
});

async function deleteUser(target) {
    console.log(`Searching for user matching: ${target}`);

    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('Error listing users:', error);
        return;
    }

    const user = users.find(u =>
        (u.email && u.email.toLowerCase().includes(target.toLowerCase())) ||
        (u.user_metadata.username && u.user_metadata.username.toLowerCase().includes(target.toLowerCase()))
    );

    if (!user) {
        console.log('User not found');
        return;
    }

    console.log(`Found user: ${user.id} (${user.email})`);

    // Delete dependent rows first
    console.log('Deleting dependent records...');

    // Check table visibility and counts
    console.log('Checking dependent records...');

    // 1. Storage Cleanup
    console.log('Cleaning up storage...');
    const { data: files, error: listError } = await supabase.storage.from('profile_assets').list(`${user.id}/gallery`);
    if (files && files.length > 0) {
        const paths = files.map(f => `${user.id}/gallery/${f.name}`);
        const { error: delError } = await supabase.storage.from('profile_assets').remove(paths);
        if (delError) console.error('Storage delete error:', delError.message);
        else console.log(`Deleted ${files.length} files from storage`);
    } else {
        console.log('No files found in storage or bucket not accessible');
    }

    const { count: vCount, error: vCheck } = await supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
    console.log(`Vehicles count: ${vCount} (Error: ${vCheck?.message})`);

    const { count: mCount, error: mCheck } = await supabase.from('profile_media').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
    console.log(`Media count: ${mCount} (Error: ${mCheck?.message})`);

    const { count: ucCount, error: ucCheck } = await supabase.from('user_connections').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
    console.log(`User Connections (user_id) count: ${ucCount} (Error: ${ucCheck?.message || ucCheck?.code})`);

    const { count: pCount, error: pCheck } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('id', user.id);
    console.log(`Profiles count: ${pCount} (Error: ${pCheck?.message})`);

    // Proceed with delete only if tables are accessible
    console.log('Attempting deletes...');

    if (!mCheck) await supabase.from('profile_media').delete().eq('user_id', user.id);
    if (!vCheck) await supabase.from('vehicles').delete().eq('user_id', user.id);

    if (ucCheck) {
        console.warn('Skipping user_connections delete due to visibility error');
    } else {
        await supabase.from('user_connections').delete().eq('user_id', user.id);
        await supabase.from('user_connections').delete().eq('connected_user_id', user.id);
    }

    await supabase.from('profiles').delete().eq('id', user.id);

    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

    if (deleteError) {
        console.error('Error deleting user:', deleteError);
    } else {
        console.log('User deleted successfully');
    }
}

deleteUser('pjloseyoutlookcom');
