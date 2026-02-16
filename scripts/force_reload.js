const { Client } = require('pg');

// Hardcoded connection string from .env
const connectionString = "postgresql://postgres.bwpmqsdykumtfusflhri:M2j2f!4Ff!wW!3z@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

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
