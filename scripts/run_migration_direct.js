const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Allow self-signed certs for migration
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function runMigration() {
    console.log('🚀 Starting Direct Migration...');

    const connectionString = process.env.POSTGRES_URL_NON_POOLING;
    if (!connectionString) {
        console.error('❌ POSTGRES_URL_NON_POOLING is missing in .env.local');
        return;
    }

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected to Postgres database directly.');

        const sqlPath = path.join(__dirname, 'fix_migration.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('📜 Executing SQL from fix_migration.sql...');
        const res = await client.query(sql);

        console.log('✅ Migration executed successfully!');
        if (Array.isArray(res)) {
            res.forEach((r, i) => console.log(`   Result ${i + 1}: ${r.command} ${r.rowCount !== null ? `(${r.rowCount} rows)` : ''}`));
        } else {
            console.log(`   Result: ${res.command} ${res.rowCount !== null ? `(${res.rowCount} rows)` : ''}`);
        }

    } catch (err) {
        console.error('❌ Migration Failed:', err);
    } finally {
        await client.end();
        console.log('🔌 Disconnected.');
    }
}

runMigration();
