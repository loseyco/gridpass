# Facebook Graph API Setup Guide

## Step 1: Get Page Access Token

1. Go to **Graph API Explorer**: https://developers.facebook.com/tools/explorer/
2. Select your **GridPass** app (App ID: 1101567568207263)
3. Click **"Generate Access Token"**
4. Grant these permissions:
   - `pages_manage_posts` - To create posts
   - `pages_read_engagement` - To read page data
   - `pages_show_list` - To list your pages
5. **Copy the Access Token** (save it securely - it's sensitive!)

## Step 2: Get Page ID

### Option A: From Graph API Explorer
1. In Graph API Explorer, make a GET request to: `/me/accounts`
2. Find your GridPass page in the results
3. Copy the `id` field

### Option B: From Facebook Page
1. Go to https://www.facebook.com/gridpassapp
2. Click "About" tab
3. Scroll to "Page transparency" → "Page ID"

## Step 3: Update the Script

Edit `gridpass_facebook_bot_api.js`:
```javascript
const FACEBOOK_PAGE_ID = 'YOUR_PAGE_ID_HERE'; // Paste Page ID
const FACEBOOK_PAGE_ACCESS_TOKEN = 'YOUR_ACCESS_TOKEN_HERE'; // Paste token
```

## Step 4: Test

```powershell
node scripts/gridpass_facebook_bot_api.js
```

## Benefits vs Browser Automation

✅ **No browser needed** - runs headless  
✅ **Much faster** (< 1 second vs 30+ seconds)  
✅ **More reliable** - no clicking/navigation issues  
✅ **Official API** - won't break if Facebook changes UI  
✅ **Returns Post ID** - can track/delete posts later  

## Security Note

⚠️ **NEVER commit the Access Token to git!**  
Consider storing it in a `.env` file or environment variable:

```javascript
const FACEBOOK_PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_TOKEN;
```
