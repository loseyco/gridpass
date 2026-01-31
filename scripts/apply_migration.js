const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config({ path: '.env.local' });

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

    try {
        await client.connect();
        console.log('Connected to Supabase Postgres.');

        const migrationFile = path.join(__dirname, '../schema_realtime.sql');
        const sql = fs.readFileSync(migrationFile, 'utf8');

        console.log(`Applying migration: ${path.basename(migrationFile)}...`);
        await client.query(sql);
        console.log('Migration applied successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

applyMigration();
