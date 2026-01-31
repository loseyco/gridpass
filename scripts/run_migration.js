const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
    let connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

    if (!connectionString) {
        console.error('Error: POSTGRES_URL_NON_POOLING or POSTGRES_URL not found in .env.local');
        process.exit(1);
    }

    // Strip existing query params to avoid SSL conflicts
    if (connectionString.includes('?')) {
        connectionString = connectionString.split('?')[0];
    }

    const client = new Client({
        connectionString: connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('Connected to database...');

        // Allow passing filename as arg, default to changelogs.sql
        const sqlFilename = process.argv[2] || 'changelogs.sql';
        const sqlPath = path.join(process.cwd(), sqlFilename);

        if (!fs.existsSync(sqlPath)) {
            console.error(`Error: File ${sqlFilename} not found at ${sqlPath}`);
            process.exit(1);
        }

        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log(`Executing ${sqlFilename}...`);
        await client.query(sql);

        console.log('Migration executed successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
