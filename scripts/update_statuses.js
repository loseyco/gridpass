
// Simple script to trigger the reset endpoint
async function run() {
    console.log("📉 Triggering Remote Status Reset...");
    try {
        const res = await fetch('http://localhost:3003/api/admin/reset-roadmap', {
            method: 'POST'
        });
        const json = await res.json();
        console.log("✅ Result:", json);
    } catch (e) {
        console.error("❌ Failed:", e.message);
    }
}

run();
