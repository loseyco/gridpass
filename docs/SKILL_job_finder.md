# SKILL: Job Finder & Application Assistant

## Purpose
Automate the discovery of relevant job opportunities for users by matching their profile (Skills, Bio) against a database of listings. Prioritizes "Remote" roles.

## Components
1.  **Matcher Script**: `scripts/job_matcher.js`
    - Loads `career-agent/listings.json`.
    - Fetches User Profile from Supabase.
    - Scores jobs based on keywords and "Remote" status.
    - Outputs top recommendations to `job_results_clean.txt`.

## Workflow

### 1. Run the Matcher
```bash
node scripts/job_matcher.js
```
*Prerequisite: User profile must exist in Supabase.*

### 2. View Results
Check `job_results_clean.txt` for the top 5 job recommendations.

## Optimization Loop (Future)
- **Feedback**: Track which jobs the user clicks/applies to.
- **Learning**: Adjust scoring weights based on user feedback (e.g., if user ignores "Java" jobs, lower the score for "Java").
- **Source Expansion**: Integrate with real job APIs instead of static JSON.

## Configuration
- `.env.local` must have:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `SUPABASE_SERVICE_ROLE_KEY`
