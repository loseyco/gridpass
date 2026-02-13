const { Client } = require('pg');
const path = require('path');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function applyMigration() {
    if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
        console.error('Error: POSTGRES_URL or DATABASE_URL not found in .env.local');
        process.exit(1);
    }

    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    const sql = `
    create table if not exists verification_requests (
      id uuid default gen_random_uuid() primary key,
      user_id uuid references auth.users(id) not null,
      stripe_session_id text,
      stripe_payment_intent_id text,
      status text default 'pending',
      created_at timestamp with time zone default timezone('utc'::text, now()) not null
    );
    `;

    try {
        await client.connect();
        console.log('Connected to Supabase Postgres.');
        console.log('Applying verification_requests migration...');
        await client.query(sql);
        console.log('Migration applied successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

applyMigration();
