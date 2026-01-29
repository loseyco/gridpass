// scripts/test-client.ts
// Run with: npx tsx scripts/test-client.ts

async function testApi() {
    const BASE_URL = 'http://localhost:3003/api/orgs';
    console.log(`🚀 Testing API at ${BASE_URL}\n`);

    // 1. GET Orgs
    console.log("1️⃣  GET /api/orgs");
    try {
        const res = await fetch(BASE_URL);
        const json = await res.json();
        console.log("   Status:", res.status);
        if (json.success) {
            console.log("   Found:", json.data.length, "orgs");
        } else {
            console.error("   ❌ Error:", json.error);
        }
    } catch (e: any) {
        console.error("   🔥 Network/Server Error:", e.message);
    }

    // 2. POST Create Org
    console.log("\n2️⃣  POST /api/orgs");
    try {
        const body = {
            name: "Typescript Racing API",
            type: "race_team"
        };
        const res = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const json = await res.json();
        console.log("   Status:", res.status);
        if (json.success) {
            console.log("   ✅ Created:", json.data.name);
            console.log("   ID:", json.data.id);
            console.log("   Type:", json.data.type);
        } else {
            console.error("   ❌ Error:", json.error);
        }
    } catch (e: any) {
        console.error("   🔥 Network/Server Error:", e.message);
    }

    // 3. Verify
    console.log("\n3️⃣  Verify Creation (GET)");
    try {
        const res = await fetch(BASE_URL);
        const json = await res.json();
        const found = json.data?.find((o: any) => o.name === "Typescript Racing API");
        if (found) {
            console.log("   ✅ Verification Successful: Found the new org.");
        } else {
            console.error("   ❌ Verification Failed: Org not found in list.");
        }
    } catch (e: any) {
        console.error("   🔥 Network/Server Error:", e.message);
    }
}

testApi();
