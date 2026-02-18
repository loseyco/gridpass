const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

puppeteer.use(StealthPlugin());

async function searchRedditGigs() {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Subreddits to check
    const subreddits = ['forhire', 'slavelabour', 'freelance_forhire'];
    const keywords = ['scraper', 'automation', 'bot', 'script', 'python', 'node', 'data entry'];

    let allGigs = [];

    console.log('Starting Gig Hunt...');

    for (const sub of subreddits) {
        console.log(`Checking r/${sub}...`);
        try {
            // Use Reddit's JSON endpoint for faster/easier parsing if possible, 
            // but let's do HTML scraping to be safe with stealth plugin against bot detection
            await page.goto(`https://old.reddit.com/r/${sub}/new/`, { waitUntil: 'networkidle2' });

            const gigs = await page.evaluate((keywords) => {
                const results = [];
                const items = document.querySelectorAll('.thing');

                items.forEach(item => {
                    const titleEl = item.querySelector('a.title');
                    const title = titleEl ? titleEl.innerText : '';
                    const link = titleEl ? titleEl.href : '';
                    const timeEl = item.querySelector('time');
                    const time = timeEl ? timeEl.getAttribute('datetime') : '';

                    // Check if it's a [Hiring] post
                    if (title.toLowerCase().includes('[hiring]') || title.toLowerCase().includes('[task]')) {
                        // Check for keywords
                        const match = keywords.some(k => title.toLowerCase().includes(k));
                        if (match) {
                            results.push({
                                source: 'Reddit',
                                sub: '', // filled outside
                                title,
                                link,
                                time
                            });
                        }
                    }
                });
                return results;
            }, keywords);

            // Add subreddit info
            gigs.forEach(g => g.sub = sub);
            allGigs = [...allGigs, ...gigs];
            console.log(`Found ${gigs.length} potential gigs in r/${sub}`);

        } catch (e) {
            console.error(`Error scraping r/${sub}:`, e.message);
        }
    }

    await browser.close();

    // Save results
    const filename = `gigs_${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(filename, JSON.stringify(allGigs, null, 2));
    console.log(`Saved ${allGigs.length} gigs to ${filename}`);

    // Output top 5 for immediate view
    console.log('\n--- TOP 5 GIGS ---');
    allGigs.slice(0, 5).forEach((g, i) => {
        console.log(`${i + 1}. ${g.title} (${g.link})`);
    });
}

searchRedditGigs();
