const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Allow self-signed certs
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function testConnection() {
    console.log('Testing connection to POSTGRES_URL_NON_POOLING...');
    const client = new Client({
        connectionString: process.env.POSTGRES_URL_NON_POOLING,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected.');
        const res = await client.query('SELECT now() as time, current_user as user, current_database() as db');
        console.log('Query Result:', res.rows[0]);
    } catch (err) {
        console.error('❌ Connection failed:', err);
    } finally {
        await client.end();
    }
}

testConnection();
