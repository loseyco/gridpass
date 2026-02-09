const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'local_data.db');
const JSON_FILE = path.join(__dirname, 'master_feed_v2.json');

const db = new Database(DB_PATH);

// 1. Setup Schema
console.log('📦 Setting up Local SQLite...');
db.exec(`
  CREATE TABLE IF NOT EXISTS scraped_listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    origin_source TEXT,
    origin_url TEXT,
    origin_author_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'new'
  );
`);

// 2. Ingest JSON
console.log('📥 Ingesting JSON...');
const rawData = fs.readFileSync(JSON_FILE, 'utf-8');
const sources = JSON.parse(rawData);

const insert = db.prepare(`
  INSERT INTO scraped_listings (title, description, origin_source, origin_url, origin_author_name)
  VALUES (@title, @description, @origin_source, @origin_url, @origin_author_name)
`);

const insertMany = db.transaction((items) => {
  for (const item of items) insert.run(item);
});

let allItems = [];

for (const source of sources) {
    // Basic flattener similar to before
    const rawItems = Array.isArray(source.items) ? source.items : [source.items];
    
    rawItems.forEach(text => {
        if (text.length < 50) return;
        
        let title = text.split('\n')[0].substring(0, 100);
        const authorMatch = text.match(/([A-Z][a-z]+ [A-Z][a-z]+)/);
        const author = authorMatch ? authorMatch[1] : 'Unknown';

        allItems.push({
            title,
            description: text.substring(0, 1000), // Truncate
            origin_source: source.source.includes('facebook') ? 'facebook' : 'linkedin',
            origin_url: source.source,
            origin_author_name: author
        });
    });
}

insertMany(allItems);
console.log(`✅ Inserted ${allItems.length} items into local_data.db`);

// 3. Query Proof
const rows = db.prepare('SELECT id, title, origin_source FROM scraped_listings').all();
console.table(rows);
