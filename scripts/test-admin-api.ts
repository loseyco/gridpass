// scripts/test-admin-api.ts
// Run with: npx tsx scripts/test-admin-api.ts

import { getOrganizations, createOrganization } from '@/actions/super-admin';
import { createClient } from '@/utils/supabase/server';

async function test() {
    console.log("🚀 Starting API Backend Test...");

    // 1. Test Fetching Orgs
    console.log("\n1️⃣  Testing getOrganizations()...");
    const orgs = await getOrganizations();
    if (orgs.success && orgs.data) {
        console.log(`✅ Success! Found ${orgs.data.length} organizations.`);
        if (orgs.data.length > 0) {
            console.log("   Latest Org:", orgs.data[0]?.name, `(${orgs.data[0]?.type})`);
        }
    } else {
        console.error("❌ Failed:", orgs.error);
    }

    // 2. Test Creating a Race Team
    console.log("\n2️⃣  Testing createOrganization('GridPass Racing')...");
    const formData = new FormData();
    formData.append('name', 'GridPass Racing CLI');
    formData.append('type', 'race_team');

    // Mock revalidatePath since we are not in Next.js context
    // We need to suppress the error or check if it fails quietly
    try {
        const newOrg = await createOrganization(formData);
        if (newOrg.success && newOrg.data) {
            console.log("✅ Success! Created:", newOrg.data.name);
            console.log("   ID:", newOrg.data.id);
            console.log("   Type:", newOrg.data.type);
            console.log("   Status:", newOrg.data.status);
        } else {
            console.error("❌ Failed:", newOrg.error);
        }
    } catch (e: any) {
        console.log("⚠️  Note: revalidatePath might fail in CLI, but DB insert should work.");
        console.log("   Error:", e.message);
    }

    // 3. Verify it was created
    console.log("\n3️⃣  Verifying Creation...");
    const verify = await getOrganizations();
    const found = verify.data?.find((o: any) => o.name === 'GridPass Racing CLI');
    if (found) {
        console.log("✅ Verified! Found 'GridPass Racing CLI' in database.");
    } else {
        console.error("❌ Verification Failed: Could not find the new org.");
    }

    process.exit(0);
}

test();
