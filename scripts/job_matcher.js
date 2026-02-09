require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Config
const TARGET_USERNAME = 'pjlosey'; // Default to user's profile
const MIN_SCORE_THRESHOLD = 1;

async function main() {
    console.log(`🔍 Starting Job Matcher for user: ${TARGET_USERNAME}...`);

    // 1. Initialize Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Missing Supabase credentials in .env.local');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Fetch User Profile
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', TARGET_USERNAME)
        .single();

    if (error || !profile) {
        console.error(`❌ Could not find profile for username: ${TARGET_USERNAME}`);
        console.error(error);
        process.exit(1);
    }

    // 2b. Fetch Garage Items from new tables
    const { data: userVehicles } = await supabase.from('user_vehicles').select('*').eq('user_id', profile.id);
    const { data: userTools } = await supabase.from('user_tools').select('*').eq('user_id', profile.id);

    console.log(`👤 Found Profile: ${profile.full_name || profile.username}`);
    const userSkills = profile.skills || [];
    const garageVehicles = userVehicles ? userVehicles.map(v => `${v.year} ${v.make} ${v.model} ${v.type}`) : [];
    const garageTools = userTools ? userTools.map(t => `${t.name} ${t.brand}`) : [];

    console.log(`   Skills: ${userSkills.join(', ') || 'None listed'}`);
    console.log(`   Garage: ${garageVehicles.length} vehicles, ${garageTools.length} tools`);

    const userBio = (profile.bio || '').toLowerCase();

    // 3. Load Job Listings
    const listingsPath = path.resolve(__dirname, '../../career-agent/listings.json');
    if (!fs.existsSync(listingsPath)) {
        console.error(`❌ Listings file not found at: ${listingsPath}`);
        process.exit(1);
    }

    const rawData = fs.readFileSync(listingsPath, 'utf8');
    const jobs = JSON.parse(rawData);
    console.log(`wp Loaded ${jobs.length} job listings.`);

    // 4. Match & Score
    const scoredJobs = jobs.map(job => {
        let score = 0;
        const jobText = (job.text || '').toLowerCase();
        const jobHtml = (job.html || '').toLowerCase();

        // A. Remote Filter (Critical)
        const isRemote = jobText.includes('remote') || jobText.includes('work from home');
        if (isRemote) score += 50; // Huge boost for remote

        // A2. Freelance / Contract (Priority)
        const isFreelance = jobText.includes('freelance') || jobText.includes('contract') || jobText.includes('consultant');
        if (isFreelance) score += 30; // Boost for freelance/contract

        // A3. Fly-in / Travel (Bonus)
        if (jobText.includes('travel') || jobText.includes('fly-in')) score += 20;

        // B. Skill Matches
        let matchedSkills = [];
        const combinedSkills = [
            ...(userSkills || []),
            ...(garageVehicles || []),
            ...(garageTools || [])
        ];

        combinedSkills.forEach(skill => {
            const safeSkill = skill.toLowerCase();
            if (jobText.includes(safeSkill)) {
                score += 10;
                matchedSkills.push(skill);
            }
        });

        // C. Negative Filters (Optional)
        // if (jobText.includes('senior') && !userBio.includes('senior')) score -= 5;

        return {
            ...job,
            score,
            isRemote,
            matchedSkills
        };
    });

    // 5. Sort & Filter
    const recommendations = scoredJobs
        .filter(job => job.score >= MIN_SCORE_THRESHOLD)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

    // 6. Output
    console.log('\n✨ Top 5 Job Recommendations ✨');
    console.log('=================================');

    let output = '';
    output += '\n✨ Top 5 Job Recommendations ✨\n';
    output += '=================================\n';

    recommendations.forEach((job, index) => {
        const titleLine = job.text.split('\n')[0];
        output += `\n${index + 1}. ${titleLine}\n`;
        output += `   🏆 Score: ${job.score}\n`;
        output += `   🌍 Remote: ${job.isRemote ? '✅' : '❌'}\n`;
        if (job.matchedSkills.length > 0) {
            output += `   Pp Skills: ${job.matchedSkills.join(', ')}\n`;
        }
        const linkMatch = job.html.match(/href="(\/jobs\/view\/[^"]+)"/);
        if (linkMatch) {
            output += `   🔗 Link: https://www.linkedin.com${linkMatch[1]}\n`;
        }
    });

    if (recommendations.length === 0) {
        output += '\nNo suitable jobs found. Try adding more skills to your profile!\n';
    }

    // 7. Save Stats (Optimization)
    const statsPath = path.resolve(__dirname, 'job_matcher_stats.json');
    let stats = {};
    if (fs.existsSync(statsPath)) {
        try {
            stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
        } catch (e) { console.error('Error reading stats:', e); }
    }

    // Update basic stats
    stats.lastRun = new Date().toISOString();
    stats.totalRuns = (stats.totalRuns || 0) + 1;
    stats.jobsFound = recommendations.length;

    fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
    console.log(`\n📈 Optimization: Saved run stats to ${statsPath}`);

    // 8. Persist to Database (New Feature)
    console.log('\n💾 Saving matches to Database...');
    try {
        const insertData = recommendations.map(job => ({
            user_id: profile.id,
            job_title: job.text.split('\n')[0].substring(0, 255),
            company_name: job.text.split('\n')[2]?.substring(0, 255) || 'Unknown',
            job_url: (job.html.match(/href="(\/jobs\/view\/[^"]+)"/) || [])[1] ? `https://www.linkedin.com${(job.html.match(/href="(\/jobs\/view\/[^"]+)"/)[1])}` : null,
            match_score: job.score,
            is_remote: job.isRemote,
            status: 'new'
        }));

        if (insertData.length > 0) {
            const { error: insertError } = await supabase
                .from('job_matches')
                .upsert(insertData, { onConflict: 'user_id, job_url', ignoreDuplicates: true }); // Prevent dupes if we add a unique constraint later

            if (insertError) {
                console.warn('⚠️  Could not save to DB (Table might not exist yet):', insertError.message);
            } else {
                console.log(`✅ Successfully saved ${insertData.length} recommendations to job_matches.`);
            }
        }
    } catch (dbErr) {
        console.warn('⚠️  DB Save Error:', dbErr.message);
    }

    console.log(output);
    fs.writeFileSync('job_results_clean.txt', output);
}

// Ensure clean exit for Cron
main().catch(err => {
    console.error('❌ Fatal Error in Job Matcher:', err);
    process.exit(1);
});
