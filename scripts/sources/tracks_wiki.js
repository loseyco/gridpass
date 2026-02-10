module.exports = {
    name: 'Tracks (Wikipedia)',
    run: async (page) => {
        const URL = 'https://en.wikipedia.org/wiki/List_of_auto_racing_tracks_in_the_United_States';
        await page.goto(URL, { waitUntil: 'domcontentloaded' });

        return await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('table.wikitable tbody tr'));
            const tracks = [];

            // Skip header row
            for (let i = 1; i < rows.length; i++) {
                const cols = rows[i].querySelectorAll('td');
                if (cols.length >= 2) {
                    const name = cols[0]?.innerText.trim();
                    const location = cols[1]?.innerText.trim();
                    const type = cols[2]?.innerText.trim() || 'Track';

                    if (name) {
                        tracks.push({
                            name: name,
                            type: 'track',
                            description: `Type: ${type}. Scraped from Wikipedia.`,
                            location: location,
                            status: 'active',
                            lead_status: 'prospect'
                        });
                    }
                }
            }
            return tracks;
        });
    }
};
