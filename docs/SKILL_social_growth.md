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

### 2. Monitor & verify
Check Supabase `leads` table for new entries.
```sql
select * from leads where status = 'new';
```

### 3. Generate Invites (Manual or Automated)
To invite a specific lead:
```bash
curl -X POST https://gridpass.app/api/admin/invite \
  -H "Content-Type: application/json" \
  -d '{"entityType": "lead", "entityId": "UUID_HERE"}'
```
*Returns: `{"link": "https://gridpass.app/claim/xyz..."}`*

### 4. Send Invite
DM the link to the user on Facebook/Discord.
"Hey [Name], saw your post about driving GT3. I set up a profile for you on GridPass: [Link]"

## Configuration
- `.env.local` must have:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `SUPABASE_SERVICE_ROLE_KEY`
    - `GEMINI_API_KEY`
