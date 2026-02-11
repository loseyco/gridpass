const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const CONFIG_FILE = path.join(__dirname, 'growth_config.json');
let CONFIG = require(CONFIG_FILE);

// --- SUPABASE & GEMINI ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRoleKey);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function optimize() {
    console.log('🧠 Analyzing Growth Strategy & Recent Leads...');

    // 1. Fetch recent leads
    const { data: leads, error } = await supabase
        .from('leads')
        .select('name, role, status, contact_info')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error || !leads.length) {
        console.log('⚠️ No leads to analyze.');
        return;
    }

    // 2. Prepare Prompt
    const prompt = `
    Analyze these recently scraped leads for a Sim Racing community app (GridPass).
    Identify patterns in successful vs weak leads.
    Suggest 3 NEW search queries for LinkedIn or Facebook Groups that would find better candidates (drivers, team managers).
    Also suggest one improvement to the outreach message.

    Current Config:
    ${JSON.stringify(CONFIG, null, 2)}

    Recent Leads:
    ${JSON.stringify(leads, null, 2)}

    Return ONLY JSON:
    {
        "critique": "short text",
        "new_linkedin_queries": ["query1", "query2", "query3"],
        "new_facebook_groups": ["url1"],
        "improved_outreach_message": "string"
    }
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const feedback = JSON.parse(text);

        console.log('💡 AI Feedback:', feedback.critique);

        // 3. Update Config (carefully)
        let updated = false;

        if (feedback.new_linkedin_queries && feedback.new_linkedin_queries.length > 0) {
            console.log('   + Adding LinkedIn Queries:', feedback.new_linkedin_queries);
            CONFIG.linkedin_queries = [...new Set([...CONFIG.linkedin_queries, ...feedback.new_linkedin_queries])];
            updated = true;
        }

        if (feedback.new_facebook_groups && feedback.new_facebook_groups.length > 0) {
            console.log('   + Suggesting FB Groups:', feedback.new_facebook_groups);
            // Don't auto-add groups as URLs might be invalid/private without checking.
            // Just log them.
        }

        if (feedback.improved_outreach_message) {
            console.log('   + Suggested Message:', feedback.improved_outreach_message);
            // Optionally update template
            // CONFIG.outreach_templates.resume_builder = feedback.improved_outreach_message;
            // updated = true; 
        }

        if (updated) {
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(CONFIG, null, 4));
            console.log('✅ Updated growth_config.json with new strategies.');
        }

    } catch (e) {
        console.error('❌ Optimization failed:', e.message);
    }
}

optimize();
