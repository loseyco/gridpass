
const TAXONOMY = {
    "Team Management": [
        { title: "Staff Roster & Credentials", description: "Manage crew profiles, licenses, and hard card expirations in one view." },
        { title: "Job Openings & Hiring", description: "Post crew vacancies and review applicant resumes directly in the app." },
        { title: "Shop Inventory & Parts", description: "Track mileage on parts, bin locations, and low-stock alerts.", category: "Team Management" },
        { title: "Travel Logistics", description: "Unified dashboard for team flights, hotels, and rental car manifests.", category: "Team Management" },
        { title: "Crew Payroll & Per Diem", description: "Automated calculation of day rates, travel days, and expense reimbursements.", category: "Team Management" },
        { title: "Unified Todo List", description: "Centralized task tracking shared across the shop and trackside crew.", category: "Team Management" }
    ],
    "Classifieds Marketplace": [
        { title: "Race Car Listings", description: "Buy and sell race chassis with verified history/mileage logs." },
        { title: "Transporter & Trailer Sales", description: "Marketplace for haulers, stackers, and pit carts." },
        { title: "Pit Equipment Exchange", description: "Trade specialized tools, setup pads, and fueling rigs." },
        { title: "Arrive & Drive Seats", description: "Find or fill funded seats for upcoming endurance races." }
    ],
    "Racing Operations": [
        { title: "Race Strategy Simulator", description: "Predict pit windows and fuel stint lengths based on live pace data." },
        { title: "Setup Sheet Cloud", description: "Version-controlled storage for suspension, aero, and tire data." },
        { title: "Unified Race Calendar", description: "Sync schedules from IMSA, SRO, and WEC into a single team view." },
        { title: "Race Entry Automation", description: "Auto-fill entry forms for major series using stored team data." }
    ],
    "Growth": [
        { title: "Founder Pack Landing Page", description: "Dedicated landing page for founding members with legal disclaimer and value prop.", status: "completed" },
        { title: "Team Join QR Code", description: "Generate unique QR codes for instant team onboarding." }
    ]
};

async function seed() {
    console.log("🌱 Seeding Refined Taxonomy...");
    const cookie = await login();

    for (const [category, items] of Object.entries(TAXONOMY)) {
        console.log(`\nProcessing Category: ${category}`);

        for (const item of items) {
            const feature = {
                title: item.title,
                description: item.description,
                category: category,
                status: item.status || 'in_progress', // Default to in_progress
                tier: category === 'Growth' ? 'founder' : 'core',
                votes: Math.floor(Math.random() * 50) + 10,
                estimated_hours: Math.floor(Math.random() * 40) + 10,
                assigned_expert: "planner"
            };

            try {
                const res = await fetch('http://localhost:3003/api/features', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
                    body: JSON.stringify(feature)
                });

                if (res.ok) console.log(`✅ Synced: ${item.title}`);
                else console.log(`❌ Failed ${res.status}: ${item.title}`);
            } catch (e) {
                console.error(`❌ Error fetching ${item.title}:`, e.message);
            }
        }
    }
}

async function login() {
    try {
        const res = await fetch('http://localhost:3003/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'pjlosey@outlook.com', password: '!Google1!' })
        });
        await res.text();
        return res.headers.get('set-cookie');
    } catch (e) {
        console.error("Login failed (is server running?):", e.message);
        return "";
    }
}

seed();
