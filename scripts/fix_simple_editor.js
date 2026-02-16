const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const schema = {
    id: "root",
    component: "Container",
    props: {
        style: {
            padding: "2rem",
            maxWidth: "600px",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: "1rem"
        }
    },
    children: [
        {
            component: "GridInput",
            bind: "os_user_profiles.full_name",
            props: { label: "Full Name" }
        },
        {
            component: "GridInput",
            bind: "os_user_profiles.username",
            props: { label: "Username" }
        },
        {
            component: "GridButton",
            props: { label: "Save Profile" },
            onAction: "submit"
        }
    ]
};

async function run() {
    console.log('Updating simple-editor schema...');
    const { data, error } = await supabase
        .from('os_apps')
        .update({ schema })
        .eq('slug', 'simple-editor')
        .select();

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Success:', data);
    }
}

run();
