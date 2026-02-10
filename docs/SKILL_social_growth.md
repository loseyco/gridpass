# SKILL: Social Growth & Lead Gen

## Purpose
Automate the acquisition of new users (Drivers/Teams) by scraping social media, parsing intent with Gemini AI, and generating "Claim your Profile" invite links.

## Components
1.  **Agent Script**: `scripts/social_growth_agent.js`
    - Scrapes Facebook Groups.
    - Uses Gemini to parse text into JSON.
    - Saves to Supabase (`leads`, `jobs`).
2.  **Invite API**: `POST /api/admin/invite`
    - Generates unique claim tokens for a given Lead ID.
3.  **Claim Page**: `https://gridpass.app/claim/[token]`
    - Conversion funnel for new users.

## Workflow

### 1. Run the Scraper
```bash
node scripts/social_growth_agent.js
```
*Prerequisite: User must be logged into Facebook in the Chrome instance if the group is private. The script waits 60s for manual login if needed.*

### 2. Run Community Manager (Page Growth)
```bash
node scripts/facebook_community_manager.js
```
*Automates inviting reactors and checking inbox messages.*

### 3. Monitor & verify

### 3. Monitor & verify
Check Supabase `leads` table for new entries.
```sql
select * from leads where status = 'new';
```

### 4. Generate Invites (Manual or Automated)
To invite a specific lead:
```bash
curl -X POST https://gridpass.app/api/admin/invite \
  -H "Content-Type: application/json" \
  -d '{"entityType": "lead", "entityId": "UUID_HERE"}'
```
*Returns: `{"link": "https://gridpass.app/claim/xyz..."}`*

### 5. Send Invite
DM the link to the user on Facebook/Discord.
"Hey [Name], saw your post about driving GT3. I set up a profile for you on GridPass: [Link]"

### 6. Automated Growth Strategy (New)
The `scripts/facebook_community_manager.js` now includes a "Smart Growth" mode:

1.  **Group Scouting**: Visits configured Facebook Groups (e.g. Sim Racing Jobs) to find posts with intent (hiring/job seeker). Uses Gemini to filter noise.
2.  **Business Discovery**: Searches for businesses (e.g. "Karting Center") to identify potential partners.

**Configuration**:
Edit `scripts/facebook_community_manager.js` directly to update:
-   `TARGET_GROUPS`: List of Facebook Group URLs to scan.
-   `SEARCH_QUERIES`: Keywords for business discovery (e.g. "Sim Racing Lounge").

**Usage**:
```bash
node scripts/facebook_community_manager.js
```
*Note: This script performs actions (visits, scrolls) that mimic human behavior. Run responsibly to avoid rate limits.*

## Configuration
- `.env.local` must have:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `SUPABASE_SERVICE_ROLE_KEY`
    - `GEMINI_API_KEY`
