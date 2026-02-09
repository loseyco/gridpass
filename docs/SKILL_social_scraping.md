# SKILL: Social Scraping (Facebook)

## Purpose
Robustly scrape Facebook Groups for Classifieds/Gigs using local browser automation (Puppeteer) with user credentials. Avoids bot detection by piggybacking on the user's existing login session.

## Prerequisites
- Local machine (not headless server).
- Chrome installed.
- User logged into Facebook.
- Chrome completely closed before running.

## The Script
`gridpass/scripts/facebook_scraper.js`

## Workflow
1. Kill existing Chrome processes (`taskkill /F /IM chrome.exe`).
2. Launch script (`node scripts/facebook_scraper.js`).
3. Script connects to User Data Dir (`AppData\Local\Google\Chrome\User Data`).
4. Navigates to target URL.
5. Scrolls to trigger lazy load.
6. Dumps posts to JSON.

## Output
`src/data/facebook_feed.json`

## Future Automation
- Cron job to run this daily (requires user to not be using Chrome at that specific moment, or we use a separate profile).
- Parse JSON with LLM to categorize into `Gig`, `For Sale`, `Rideshare`.
- Push to Supabase `classifieds` table.
