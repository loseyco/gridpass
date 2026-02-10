
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email?.includes('pjlosey'));

    if (!user) return;

    // Find services mentioning 'Coaching' or 'Driver' in title or description
    const { data: services } = await supabase
        .from('user_services')
        .select('*')
        .eq('user_id', user.id)
        .ilike('description', '%Driver coaching%');

    console.log('Found services to remove:', services?.length);
    services?.forEach(s => console.log(`- ${s.title}: ${s.description}`));

    if (services && services.length > 0) {
        const { error } = await supabase
            .from('user_services')
            .delete()
            .eq('user_id', user.id)
            .ilike('description', '%Driver coaching%');

        if (error) console.error('Error deleting:', error);
        else console.log('Successfully removed services.');
    }
}

main();
