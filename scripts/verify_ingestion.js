const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkResults() {
    try {
        await client.connect();
        const res = await client.query('SELECT COUNT(*) FROM os_league_race_results');
        console.log('Race Results Count:', res.rows[0].count);

        const members = await client.query('SELECT * FROM os_league_members');
        console.log('Members Count:', members.rows.length);
        if (members.rows.length > 0) {
            console.log('Sample Member:', members.rows[0].iracing_customer_id, members.rows[0].status);
        }

        await client.end();
    } catch (err) {
        console.error('Error checking DB:', err);
    }
}

checkResults();
