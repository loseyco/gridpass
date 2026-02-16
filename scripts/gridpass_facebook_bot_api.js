const fs = require('fs');
const path = require('path');

// CONFIG - Update these values
const FACEBOOK_PAGE_ID = 'YOUR_PAGE_ID_HERE'; // Get from facebook.com/gridpassapp
const FACEBOOK_PAGE_ACCESS_TOKEN = 'YOUR_PAGE_ACCESS_TOKEN_HERE'; // Get from Graph API Explorer
const GRIDPASS_API_URL = 'http://localhost:3000/api';
const LOG_FILE = path.join(__dirname, 'gridpass_facebook_bot_log.txt');

function log(message) {
    const timestamp = new Date().toISOString();
    console.log(message);
    fs.appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`);
}

async function getNewMembers() {
    const announcedFile = path.join(__dirname, 'announced_members.json');
    let announced = fs.existsSync(announcedFile) ? JSON.parse(fs.readFileSync(announcedFile, 'utf8')) : [];
    const announcedUsernames = new Set(announced.map(a => a.username));

    // TODO: Replace with actual API call
    const mockMembers = [
        { username: 'newracer123', name: 'John Doe', created_at: new Date().toISOString() }
    ];

    const newMembers = mockMembers.filter(m => !announcedUsernames.has(m.username));
    log(`📊 ${newMembers.length} new members to announce`);
    return newMembers;
}

async function postToFacebookAPI(member) {
    try {
        const postText = `🎉 Welcome to GridPass, ${member.name}!

Check out their profile: https://gridpass.app/u/${member.username}

#GridPass #Motorsports #NewMember`;

        log(`📤 Posting via Facebook Graph API...`);

        const response = await fetch(`https://graph.facebook.com/v18.0/${FACEBOOK_PAGE_ID}/feed`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: postText,
                access_token: FACEBOOK_PAGE_ACCESS_TOKEN
            })
        });

        const result = await response.json();

        if (result.id) {
            log(`✅ Post published! Post ID: ${result.id}`);

            // Save to prevent duplicates
            const announcedFile = path.join(__dirname, 'announced_members.json');
            let announced = fs.existsSync(announcedFile) ? JSON.parse(fs.readFileSync(announcedFile, 'utf8')) : [];
            announced.push({
                username: member.username,
                announced_at: new Date().toISOString(),
                facebook_post_id: result.id
            });
            fs.writeFileSync(announcedFile, JSON.stringify(announced, null, 2));

            return true;
        } else {
            log(`❌ Facebook API Error: ${JSON.stringify(result)}`);
            return false;
        }

    } catch (err) {
        log(`❌ Error: ${err.message}`);
        return false;
    }
}

(async () => {
    try {
        log('🚀 Starting GridPass → Facebook API Bot...');

        // Validate config
        if (FACEBOOK_PAGE_ID === 'YOUR_PAGE_ID_HERE' || FACEBOOK_PAGE_ACCESS_TOKEN === 'YOUR_PAGE_ACCESS_TOKEN_HERE') {
            log('❌ Please update FACEBOOK_PAGE_ID and FACEBOOK_PAGE_ACCESS_TOKEN in the script');
            process.exit(1);
        }

        const newMembers = await getNewMembers();

        if (newMembers.length === 0) {
            log('ℹ️ No new members to announce');
            process.exit(0);
        }

        for (const member of newMembers) {
            log(`📣 Announcing ${member.name} (@${member.username})`);
            await postToFacebookAPI(member);
        }

        log('✅ Done!');

    } catch (err) {
        log(`💥 Fatal error: ${err.message}`);
        process.exit(1);
    }
})();
