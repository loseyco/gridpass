// Node 18+ has global fetch
const BASE_URL = 'http://localhost:3003';
// We need the cookie. For this script, we'll try to just use valid static data.
// In reality, the /api/admin/registry/status endpoint requires auth.
// We will reuse the verify_api_master_list logic to login first.

async function seed() {
    // 1. Login
    console.log("🔑 Logging in...");
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'pjlosey@outlook.com', password: '!Google1!' })
    });

    if (!loginRes.ok) {
        console.error("Login failed");
        return;
    }

    const cookie = loginRes.headers.get('set-cookie');

    // 2. Full List (From original page.tsx)
    const fullList = [
        { method: "POST", path: "/api/auth/register", category: "0. Core: Auth & Session", desc: "User Registration" },
        { method: "POST", path: "/api/auth/login", category: "0. Core: Auth & Session", desc: "User Login" },
        { method: "POST", path: "/api/auth/logout", category: "0. Core: Auth & Session", desc: "Logout" },
        { method: "POST", path: "/api/auth/refresh", category: "0. Core: Auth & Session", desc: "Refresh Session" },
        { method: "POST", path: "/api/auth/recover", category: "0. Core: Auth & Session", desc: "Forgot Password" },
        { method: "POST", path: "/api/auth/reset-password", category: "0. Core: Auth & Session", desc: "Reset Password" },
        { method: "GET", path: "/api/auth/session", category: "0. Core: Auth & Session", desc: "Get Session" },

        { method: "GET", path: "/api/users", category: "1. Core: Users & Profiles", desc: "List all users (Admin)" },
        { method: "POST", path: "/api/users", category: "1. Core: Users & Profiles", desc: "Create User (Admin)" },
        { method: "GET", path: "/api/users/me", category: "1. Core: Users & Profiles", desc: "Get my profile" },
        { method: "PUT", path: "/api/users/me", category: "1. Core: Users & Profiles", desc: "Update my profile" },
        { method: "GET", path: "/api/users/{userId}", category: "1. Core: Users & Profiles", desc: "Get user by ID" },
        { method: "PUT", path: "/api/users/{userId}", category: "1. Core: Users & Profiles", desc: "Update user" },
        { method: "DELETE", path: "/api/users/{userId}", category: "1. Core: Users & Profiles", desc: "Delete user" },
        { method: "GET", path: "/api/profiles/{handle}", category: "1. Core: Users & Profiles", desc: "Get Public Profile" },
        { method: "PUT", path: "/api/profiles/me", category: "1. Core: Users & Profiles", desc: "Update Profile" },
        { method: "POST", path: "/api/profiles/me/avatar", category: "1. Core: Users & Profiles", desc: "Upload Avatar" },

        { method: "GET", path: "/api/vehicles", category: "2. Core: Vehicles (Garage)", desc: "List my vehicles" },
        { method: "POST", path: "/api/vehicles", category: "2. Core: Vehicles (Garage)", desc: "Add vehicle" },
        { method: "GET", path: "/api/vehicles/{vehicleId}", category: "2. Core: Vehicles (Garage)", desc: "Get vehicle" },
        { method: "PUT", path: "/api/vehicles/{vehicleId}", category: "2. Core: Vehicles (Garage)", desc: "Update vehicle" },
        { method: "DELETE", path: "/api/vehicles/{vehicleId}", category: "2. Core: Vehicles (Garage)", desc: "Delete vehicle" },
        { method: "GET", path: "/api/vehicles/{vehicleId}/documents", category: "2. Core: Vehicles (Garage)", desc: "List Docs" },
        { method: "POST", path: "/api/vehicles/{vehicleId}/documents", category: "2. Core: Vehicles (Garage)", desc: "Upload Doc" },
        { method: "DELETE", path: "/api/vehicles/{vehicleId}/documents/{docId}", category: "2. Core: Vehicles (Garage)", desc: "Delete Doc" },

        { method: "GET", path: "/api/orgs", category: "3. Core: Organizations", desc: "List organizations" },
        { method: "POST", path: "/api/orgs", category: "3. Core: Organizations", desc: "Create organization" },
        { method: "GET", path: "/api/orgs/{orgId}", category: "3. Core: Organizations", desc: "Get Org" },
        { method: "PUT", path: "/api/orgs/{orgId}", category: "3. Core: Organizations", desc: "Update Org" },
        { method: "DELETE", path: "/api/orgs/{orgId}", category: "3. Core: Organizations", desc: "Delete Org" },

        { method: "GET", path: "/api/orgs/{orgId}/members", category: "3b. Org Membership", desc: "List Members" },
        { method: "POST", path: "/api/orgs/{orgId}/members", category: "3b. Org Membership", desc: "Add Member" },
        { method: "PUT", path: "/api/orgs/{orgId}/members/{memberId}", category: "3b. Org Membership", desc: "Update Member" },
        { method: "DELETE", path: "/api/orgs/{orgId}/members/{memberId}", category: "3b. Org Membership", desc: "Remove Member" },
        { method: "POST", path: "/api/orgs/{orgId}/invites", category: "3b. Org Membership", desc: "Create Invite" },
        { method: "GET", path: "/api/orgs/{orgId}/invites", category: "3b. Org Membership", desc: "List Invites" },
        { method: "POST", path: "/api/orgs/{orgId}/invites/{inviteId}/accept", category: "3b. Org Membership", desc: "Accept Invite" },
        { method: "POST", path: "/api/orgs/{orgId}/invites/{inviteId}/decline", category: "3b. Org Membership", desc: "Decline Invite" },

        { method: "GET", path: "/api/v1/roles", category: "4. Roles (Season Scoped)", desc: "List Roles" },
        { method: "POST", path: "/api/v1/roles", category: "4. Roles (Season Scoped)", desc: "Apply for Role" },
        { method: "GET", path: "/api/v1/roles/{roleId}", category: "4. Roles (Season Scoped)", desc: "Get Role" },
        { method: "PUT", path: "/api/v1/roles/{roleId}", category: "4. Roles (Season Scoped)", desc: "Update Role" },
        { method: "DELETE", path: "/api/v1/roles/{roleId}", category: "4. Roles (Season Scoped)", desc: "Delete Role" },
        { method: "POST", path: "/api/v1/roles/{roleId}/verify", category: "4. Roles (Season Scoped)", desc: "Verify Role (Admin)" },

        { method: "GET", path: "/api/v1/credentials", category: "5. Credentials", desc: "List Credentials" },
        { method: "POST", path: "/api/v1/credentials", category: "5. Credentials", desc: "Add Credential" },
        { method: "GET", path: "/api/v1/credentials/{credentialId}", category: "5. Credentials", desc: "Get Credential" },
        { method: "PUT", path: "/api/v1/credentials/{credentialId}", category: "5. Credentials", desc: "Update Credential" },
        { method: "DELETE", path: "/api/v1/credentials/{credentialId}", category: "5. Credentials", desc: "Delete Credential" },
        { method: "POST", path: "/api/v1/credentials/{cId}/verify", category: "5. Credentials", desc: "Verify Credential" },
        { method: "POST", path: "/api/v1/credentials/{cId}/issue-qr", category: "5. Credentials", desc: "Issue QR" },
        { method: "POST", path: "/api/v1/credentials/{cId}/revoke-qr", category: "5. Credentials", desc: "Revoke QR" },

        { method: "GET", path: "/api/v1/tracks", category: "6. Tracks & Layouts", desc: "List Tracks" },
        { method: "POST", path: "/api/v1/tracks", category: "6. Tracks & Layouts", desc: "Create Track" },
        { method: "GET", path: "/api/v1/tracks/{trackId}", category: "6. Tracks & Layouts", desc: "Get Track" },
        { method: "PUT", path: "/api/v1/tracks/{trackId}", category: "6. Tracks & Layouts", desc: "Update Track" },
        { method: "DELETE", path: "/api/v1/tracks/{trackId}", category: "6. Tracks & Layouts", desc: "Delete Track" },
        { method: "GET", path: "/api/v1/tracks/{trackId}/layouts", category: "6. Tracks & Layouts", desc: "List Layouts" },
        { method: "POST", path: "/api/v1/tracks/{trackId}/layouts", category: "6. Tracks & Layouts", desc: "Add Layout" },
        { method: "PUT", path: "/api/v1/tracks/{trackId}/layouts/{lId}", category: "6. Tracks & Layouts", desc: "Update Layout" },
        { method: "DELETE", path: "/api/v1/tracks/{trackId}/layouts/{lId}", category: "6. Tracks & Layouts", desc: "Delete Layout" },

        { method: "GET", path: "/api/v1/events", category: "7. Events", desc: "List Events" },
        { method: "POST", path: "/api/v1/events", category: "7. Events", desc: "Create Event" },
        { method: "GET", path: "/api/v1/events/{eventId}", category: "7. Events", desc: "Get Event" },
        { method: "PUT", path: "/api/v1/events/{eventId}", category: "7. Events", desc: "Update Event" },
        { method: "DELETE", path: "/api/v1/events/{eventId}", category: "7. Events", desc: "Delete Event" },
        { method: "GET", path: "/api/v1/events/{id}/requirements", category: "7. Events", desc: "List Reqs" },
        { method: "POST", path: "/api/v1/events/{id}/requirements", category: "7. Events", desc: "Add Req" },
        { method: "DELETE", path: "/api/v1/events/{id}/requirements/{rId}", category: "7. Events", desc: "Remove Req" },
        { method: "GET", path: "/api/v1/events/{id}/sessions", category: "7. Events", desc: "List Sessions" },
        { method: "POST", path: "/api/v1/events/{id}/sessions", category: "7. Events", desc: "Add Session" },
        { method: "PUT", path: "/api/v1/events/{id}/sessions/{sId}", category: "7. Events", desc: "Update Session" },
        { method: "DELETE", path: "/api/v1/events/{id}/sessions/{sId}", category: "7. Events", desc: "Delete Session" },

        { method: "GET", path: "/api/v1/checkins", category: "8. Check-ins", desc: "List Checkins" },
        { method: "POST", path: "/api/v1/checkins", category: "8. Check-ins", desc: "Perform Checkin" },
        { method: "GET", path: "/api/v1/checkins/{checkinId}", category: "8. Check-ins", desc: "Get Checkin" },
        { method: "POST", path: "/api/v1/checkins/{checkinId}/verify", category: "8. Check-ins", desc: "Verify Checkin" },
        { method: "POST", path: "/api/v1/checkins/{checkinId}/void", category: "8. Check-ins", desc: "Void Checkin" },
        { method: "DELETE", path: "/api/v1/checkins/{checkinId}", category: "8. Check-ins", desc: "Delete Checkin" },

        { method: "GET", path: "/api/wallet/documents", category: "9. Wallet (Docs)", desc: "List Documents" },
        { method: "POST", path: "/api/wallet/documents", category: "9. Wallet (Docs)", desc: "Upload Document" },
        { method: "GET", path: "/api/wallet/documents/{docId}", category: "9. Wallet (Docs)", desc: "Get Document" },
        { method: "DELETE", path: "/api/wallet/documents/{docId}", category: "9. Wallet (Docs)", desc: "Delete Document" },
        { method: "GET", path: "/api/wallet/shares", category: "9. Wallet (Docs)", desc: "List Shares" },
        { method: "POST", path: "/api/wallet/shares", category: "9. Wallet (Docs)", desc: "Share Document" },
        { method: "DELETE", path: "/api/wallet/shares/{shareId}", category: "9. Wallet (Docs)", desc: "Revoke Share" },

        { method: "GET", path: "/api/tasks", category: "10. Tasks", desc: "List Tasks" },
        { method: "POST", path: "/api/tasks", category: "10. Tasks", desc: "Create Task" },
        { method: "GET", path: "/api/tasks/{taskId}", category: "10. Tasks", desc: "Get Task" },
        { method: "PUT", path: "/api/tasks/{taskId}", category: "10. Tasks", desc: "Update Task" },
        { method: "DELETE", path: "/api/tasks/{taskId}", category: "10. Tasks", desc: "Delete Task" },
        { method: "GET", path: "/api/task-lists", category: "10. Tasks", desc: "List Task Lists" },
        { method: "POST", path: "/api/task-lists", category: "10. Tasks", desc: "Create List" },
        { method: "PUT", path: "/api/task-lists/{listId}", category: "10. Tasks", desc: "Update List" },
        { method: "DELETE", path: "/api/task-lists/{listId}", category: "10. Tasks", desc: "Delete List" },

        { method: "GET", path: "/api/listings", category: "11. Classifieds", desc: "List Listings" },
        { method: "POST", path: "/api/listings", category: "11. Classifieds", desc: "Create Listing" },
        { method: "GET", path: "/api/listings/{listingId}", category: "11. Classifieds", desc: "Get Listing" },
        { method: "PUT", path: "/api/listings/{listingId}", category: "11. Classifieds", desc: "Update Listing" },
        { method: "DELETE", path: "/api/listings/{listingId}", category: "11. Classifieds", desc: "Delete Listing" },
        { method: "POST", path: "/api/listings/{listingId}/images", category: "11. Classifieds", desc: "Upload Image" },

        { method: "GET", path: "/api/jobs", category: "12. Jobs & Careers", desc: "List Jobs" },
        { method: "POST", path: "/api/jobs", category: "12. Jobs & Careers", desc: "Post Job" },
        { method: "GET", path: "/api/jobs/{jobId}", category: "12. Jobs & Careers", desc: "Get Job" },
        { method: "PUT", path: "/api/jobs/{jobId}", category: "12. Jobs & Careers", desc: "Update Job" },
        { method: "DELETE", path: "/api/jobs/{jobId}", category: "12. Jobs & Careers", desc: "Delete Job" },
        { method: "POST", path: "/api/jobs/{jobId}/apply", category: "12. Jobs & Careers", desc: "Apply for Job" },
        { method: "GET", path: "/api/jobs/{jobId}/applications", category: "12. Jobs & Careers", desc: "View Applications" },
        { method: "PUT", path: "/api/applications/{appId}", category: "12. Jobs & Careers", desc: "Update Application" },

        { method: "GET", path: "/api/resumes/me", category: "13. Resumes", desc: "Get My Resume" },
        { method: "PUT", path: "/api/resumes/me", category: "13. Resumes", desc: "Update Resume" },
        { method: "POST", path: "/api/resumes/me/verify", category: "13. Resumes", desc: "Verify Resume" },

        { method: "GET", path: "/api/trips", category: "14. Logistics (Trips)", desc: "List Trips" },
        { method: "POST", path: "/api/trips", category: "14. Logistics (Trips)", desc: "Create Trip" },
        { method: "GET", path: "/api/trips/{tripId}", category: "14. Logistics (Trips)", desc: "Get Trip" },
        { method: "PUT", path: "/api/trips/{tripId}", category: "14. Logistics (Trips)", desc: "Update Trip" },
        { method: "DELETE", path: "/api/trips/{tripId}", category: "14. Logistics (Trips)", desc: "Delete Trip" },
        { method: "GET", path: "/api/trips/{tripId}/items", category: "14. Logistics (Trips)", desc: "List Items" },
        { method: "POST", path: "/api/trips/{tripId}/items", category: "14. Logistics (Trips)", desc: "Add Item" },
        { method: "PUT", path: "/api/trips/{tripId}/items/{itemId}", category: "14. Logistics (Trips)", desc: "Update Item" },
        { method: "DELETE", path: "/api/trips/{tripId}/items/{itemId}", category: "14. Logistics (Trips)", desc: "Remove Item" },

        { method: "GET", path: "/api/inventory", category: "15. Inventory", desc: "List Inventory" },
        { method: "POST", path: "/api/inventory", category: "15. Inventory", desc: "Add Item" },
        { method: "GET", path: "/api/inventory/{itemId}", category: "15. Inventory", desc: "Get Item" },
        { method: "PUT", path: "/api/inventory/{itemId}", category: "15. Inventory", desc: "Update Item" },
        { method: "DELETE", path: "/api/inventory/{itemId}", category: "15. Inventory", desc: "Delete Item" },

        { method: "POST", path: "/api/uploads/presign", category: "16. Media & Uploads", desc: "Presign Upload" },
        { method: "POST", path: "/api/uploads/complete", category: "16. Media & Uploads", desc: "Complete Upload" },
        { method: "GET", path: "/api/media/{mediaId}", category: "16. Media & Uploads", desc: "Get Media Info" },

        { method: "GET", path: "/api/notifications", category: "17. Notifications", desc: "List Notifications" },
        { method: "PUT", path: "/api/notifications/{nId}", category: "17. Notifications", desc: "Mark Read" },

        { method: "GET", path: "/api/threads", category: "18. Messaging", desc: "List Threads" },
        { method: "POST", path: "/api/threads", category: "18. Messaging", desc: "Start Thread" },
        { method: "GET", path: "/api/threads/{threadId}", category: "18. Messaging", desc: "Get Thread" },
        { method: "GET", path: "/api/threads/{threadId}/messages", category: "18. Messaging", desc: "List Messages" },
        { method: "POST", path: "/api/threads/{threadId}/messages", category: "18. Messaging", desc: "Send Message" },

        { method: "GET", path: "/api/admin/health", category: "19. System Admin", desc: "System Health" },
        { method: "GET", path: "/api/admin/stats", category: "19. System Admin", desc: "System Stats" },
        { method: "GET", path: "/api/admin/audit-log", category: "19. System Admin", desc: "Audit Log" },
        { method: "GET", path: "/api/admin/rls-tests", category: "19. System Admin", desc: "RLS Tests" },
        { method: "GET", path: "/api/webhooks", category: "19. System Admin", desc: "List Webhooks" },
        { method: "POST", path: "/api/webhooks", category: "19. System Admin", desc: "Create Webhook" },
        { method: "DELETE", path: "/api/webhooks/{webhookId}", category: "19. System Admin", desc: "Delete Webhook" },

        { method: "POST", path: "/api/ai/local", category: "20. Local AI (Ollama)", desc: "Generate Text" }
    ];

    console.log(`📡 Seeding ${fullList.length} endpoints...`);

    let count = 0;
    for (const ep of fullList) {
        // We set status to 'untested' unless it is already verified (Upsert logic in backend handles this if we omit status, 
        // but here we must provide status to be safe. Actually, the backend upsert might OVERWRITE 'verified' with 'untested' if we aren't careful.
        // Let's modify the backend route? Or just assume that if we seed 'untested', we might clobber.
        // WAIT: The backend requires status. 
        // Strategy: We will fetch the existing list first to check status, OR we rely on a smart upsert.
        // My backend uses: .upsert({ ... }, { onConflict: 'method, path' }). This WILL update status.
        // I should only seed if NOT exists. 
        // But Supabase simple upsert overwrites.
        // Let's use the 'INSERT ... ON CONFLICT DO NOTHING' equivalent via the client?
        // Supabase JS .insert().select() with { ignoreDuplicates: true }?

        // Better: Just use the same loop but call the backend with a flag? 
        // No, let's use a specific "seed" Payload or just be careful.
        // Actually, if I send 'untested', it overwrites 'verified'. That's bad.
        // I will change the script to check if it exists first? Too slow (50 requests).

        // ALTERNATIVE: Use Sql?
        // "INSERT INTO ... ON CONFLICT (method, path) DO UPDATE SET category = EXCLUDED.category;"
        // This preserves 'status' but updates 'category' (which I just fixed via SQL anyway).
        // I want to INSERT if missing.

        // I will use `ignoreDuplicates: true` in the Post logic? 
        // The API route currently does: .upsert(). 
        // I will modify the script to call a new "seed" mode or just assume I re-run verification after seeding.
        // Re-running verification is fast (2 sec).
        // So: Seed ALL as 'untested', then Re-run Verification. 
        // This guarantees everything is in the DB and the verified ones turn green again.

        await fetch(`${BASE_URL}/api/admin/registry/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
            body: JSON.stringify({
                method: ep.method,
                path: ep.path,
                status: 'untested', // Default to untested
                response_ms: 0
            })
        });
        process.stdout.write('.');
        count++;
    }
    console.log(`\n✅ Seeded ${count} endpoints.`);
}

seed();
