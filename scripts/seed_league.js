const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function seed() {
    try {
        await client.connect();

        console.log('Seeding League Data...');

        // 1. Create League
        const leagueRes = await client.query(`
            INSERT INTO os_leagues (name, slug, description)
            VALUES ('Official GridPass League', 'official-gridpass', ' The premier simulation racing league.')
            ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
            RETURNING id;
        `);
        const leagueId = leagueRes.rows[0].id;
        console.log('League ID:', leagueId);

        // 2. Create Season
        const seasonRes = await client.query(`
            INSERT INTO os_league_seasons (league_id, name, start_date, end_date, is_active)
            VALUES ($1, 'Season 1 2026', '2026-01-01', '2026-12-31', true)
            RETURNING id;
        `, [leagueId]);
        const seasonId = seasonRes.rows[0].id;
        console.log('Season ID:', seasonId);

        console.log('Seeding Complete!');
        await client.end();
    } catch (err) {
        console.error('Seeding Error:', err);
        process.exit(1);
    }
}

seed();
