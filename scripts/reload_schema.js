require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

// Try various env vars for connection string
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!connectionString) {
    console.error('No connection string found in .env.local');
    process.exit(1);
}

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        console.log('Connecting to DB...');
        await client.connect();
        console.log('Connected. Sending NOTIFY pgrst, "reload schema"...');
        await client.query("NOTIFY pgrst, 'reload schema'");
        console.log('Success: Schema reload notified.');
        await client.end();
    } catch (err) {
        console.error('Error executing query:', err);
        process.exit(1);
    }
}

run();
