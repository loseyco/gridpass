module.exports = {
    name: 'Teams (Wikipedia - IMSA 2025)',
    run: async (page) => {
        const URL = 'https://en.wikipedia.org/wiki/2025_IMSA_SportsCar_Championship';
        await page.goto(URL, { waitUntil: 'domcontentloaded' });

        return await page.evaluate(() => {
            const teams = [];
            // Wikipedia tables for entry lists usually have 'Team' column
            const tables = Array.from(document.querySelectorAll('table.wikitable'));

            tables.forEach(table => {
                // Heuristic: Check if table headers contain "Team" or "Entrant"
                const headers = Array.from(table.querySelectorAll('th')).map(th => th.innerText.trim());
                let teamColIndex = headers.findIndex(h => h.includes('Team') || h.includes('Entrant'));
                let carColIndex = headers.findIndex(h => h.includes('Car') || h.includes('Vehicle') || h.includes('Chassis'));

                // Fallback: simple position (Team is usually col 1 or 2)
                if (teamColIndex === -1 && headers.length > 2) teamColIndex = 1;

                if (teamColIndex !== -1) {
                    const rows = Array.from(table.querySelectorAll('tbody tr'));
                    rows.forEach(row => {
                        const cols = row.querySelectorAll('td');
                        // Wiki rows often start with header cell (th) for car number
                        const shift = row.querySelector('th') ? 1 : 0;

                        // If there is a TH, the TD indices shift
                        const effectiveTeamIndex = teamColIndex - shift;

                        if (cols.length > effectiveTeamIndex && effectiveTeamIndex >= 0) {
                            let teamName = cols[effectiveTeamIndex]?.innerText.trim();

                            // Sometimes the team name is in the TH if it's the first column
                            if (row.querySelector('th') && teamColIndex === 0) {
                                teamName = row.querySelector('th').innerText.trim();
                            }

                            const car = cols[carColIndex - shift]?.innerText.trim() || 'Unknown';

                            // Filter out garbage
                            if (teamName && teamName.length > 2 && !teamName.includes('[')) {
                                teams.push({
                                    name: teamName.replace(/\[.*?\]/g, ''), // Remove citations [1]
                                    type: 'team',
                                    description: `IMSA 2025 Competitor. Car: ${car}`,
                                    location: 'Global', // Wiki doesn't always have location in the table
                                    status: 'active',
                                    lead_status: 'prospect'
                                });
                            }
                        }
                    });
                }
            });

            // Deduplicate by name
            const uniqueTeams = [];
            const seen = new Set();
            teams.forEach(t => {
                if (!seen.has(t.name)) {
                    seen.add(t.name);
                    uniqueTeams.push(t);
                }
            });

            return uniqueTeams;
        });
    }
};
