require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function main() {
    console.log('Creating job_matches table...');

    // Use Service Role Key for Admin Access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) { return console.error('Missing env vars'); }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Using RPC if available, or just raw DDL via a stored procedure if one exists. 
    // Since we don't have a direct SQL runner, we will try to create a function first OR rely on the dashboard.
    // Actually, let's use the `pg` library if possible? No, let's try to use the REST API to call a function.

    // BETTER APPROACH: Just log the SQL for the user to run if we can't run it.
    // BUT WAIT, I can use the `mcp_supabase-mcp-server_execute_sql` tool again? No, it failed.

    // I will try to use the `pg` library if installed. It's likely not installed.
    // I will try to use the `supabase` CLI if available?

    // Let's try to run a raw SQL query via `rpc` if a helper function exists.
    // If not, I will output the SQL to a file and ask the user to run it.

    // Wait! I can use `psql` if I have the connection string? 
    // The user's metadata says they are using Supabase.

    // Let's try to create the table using the `pg` library by installing it temporarily?
    // "npm install pg"

    console.log(`
    PLEASE RUN THIS SQL IN YOUR SUPABASE DASHBOARD:

    create table if not exists public.job_matches (
        id uuid default gen_random_uuid() primary key,
        user_id uuid references auth.users(id) on delete cascade,
        job_title text not null,
        company_name text,
        job_url text,
        match_score int,
        is_remote boolean default false,
        status text default 'new',
        created_at timestamptz default now()
    );
    alter table public.job_matches enable row level security;
    create policy "Users can view their own matches" on public.job_matches for select using (auth.uid() = user_id);
    create policy "Service role can insert matches" on public.job_matches for insert with check (true);
    `);
}

main();
