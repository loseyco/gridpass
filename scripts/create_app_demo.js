const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createDemoApp() {
    const appName = "Pro Code Dashboard";
    const appSlug = "pro-code-dashboard";

    console.log(`Creating demo app: ${appName} (${appSlug})...`);

    // Define a rich schema
    const schema = {
        id: "root_container",
        component: "Container",
        props: {
            style: {
                padding: "2rem",
                maxWidth: "1200px",
                margin: "0 auto",
                display: "flex",
                flexDirection: "column",
                gap: "2rem"
            }
        },
        children: [
            // Header
            {
                id: "header_row",
                component: "Row",
                props: {
                    style: { justifyContent: "space-between", alignItems: "center" }
                },
                children: [
                    {
                        id: "title_container",
                        component: "Container",
                        props: { style: { padding: 0 } },
                        children: [
                            {
                                component: "Container",
                                props: {
                                    children: appName,
                                    style: { fontSize: "2rem", fontWeight: "bold", color: "#fff", padding: 0 }
                                }
                            },
                            {
                                component: "Container",
                                props: {
                                    children: "Live System Monitoring",
                                    style: { fontSize: "1rem", color: "#888", padding: 0 }
                                }
                            }
                        ]
                    },
                    {
                        component: "GridBadgePicker",
                        props: {
                            label: "Status",
                            options: ["Online", "Offline", "Maintenance"],
                            defaultValue: "Online"
                        }
                    }
                ]
            },

            // Stats Row
            {
                id: "stats_row",
                component: "Row",
                props: { style: { gap: "1.5rem" } },
                children: [
                    // Stat 1
                    {
                        component: "Container",
                        props: {
                            style: { flex: 1, background: "#1a1a1a", padding: "1.5rem", borderRadius: "12px", border: "1px solid #333" }
                        },
                        children: [
                            { component: "GridGauge", props: { label: "Server Load", value: 65, max: 100, unit: "%" } }
                        ]
                    },
                    // Stat 2
                    {
                        component: "Container",
                        props: {
                            style: { flex: 1, background: "#1a1a1a", padding: "1.5rem", borderRadius: "12px", border: "1px solid #333" }
                        },
                        children: [
                            { component: "GridGauge", props: { label: "Memory Usage", value: 42, max: 64, unit: "GB" } }
                        ]
                    },
                    // Stat 3
                    {
                        component: "Container",
                        props: {
                            style: { flex: 1, background: "#1a1a1a", padding: "1.5rem", borderRadius: "12px", border: "1px solid #333" }
                        },
                        children: [
                            { component: "GridGauge", props: { label: "Network", value: 850, max: 1000, unit: "Mbps" } }
                        ]
                    }
                ]
            },

            // Charts Section
            {
                id: "charts_section",
                component: "Container",
                props: {
                    style: { background: "#111", padding: "2rem", borderRadius: "12px", border: "1px solid #222" }
                },
                children: [
                    {
                        component: "Container",
                        props: {
                            children: "Traffic Analysis",
                            style: { fontSize: "1.2rem", fontWeight: "600", marginBottom: "1rem", padding: 0 }
                        }
                    },
                    {
                        component: "GridChart",
                        props: {
                            type: "area",
                            data: [
                                { name: "Mon", value: 4000 },
                                { name: "Tue", value: 3000 },
                                { name: "Wed", value: 2000 },
                                { name: "Thu", value: 2780 },
                                { name: "Fri", value: 1890 },
                                { name: "Sat", value: 2390 },
                                { name: "Sun", value: 3490 }
                            ],
                            height: 300
                        }
                    }
                ]
            },

            // Controls
            {
                id: "controls_row",
                component: "Row",
                props: { style: { gap: "2rem" } },
                children: [
                    {
                        component: "Container",
                        props: { style: { flex: 1 } },
                        children: [
                            { component: "GridToggle", props: { label: "Auto-Scaling", defaultChecked: true } },
                            { component: "GridToggle", props: { label: "Debug Mode", defaultChecked: false } }
                        ]
                    },
                    {
                        component: "Container",
                        props: { style: { flex: 1 } },
                        children: [
                            { component: "GridInput", props: { label: "Command", placeholder: "Enter system command..." } }
                        ]
                    }
                ]
            }
        ]
    };

    // Check if app exists
    const { data: existingApp } = await supabase
        .from('os_apps')
        .select('id')
        .eq('slug', appSlug)
        .single();

    if (existingApp) {
        console.log("App already exists. Updating schema...");
        const { error } = await supabase
            .from('os_apps')
            .update({
                name: appName,
                schema: schema,
                updated_at: new Date().toISOString()
            })
            .eq('id', existingApp.id);

        if (error) {
            console.error("Error updating app:", error.message);
        } else {
            console.log("✅ App updated successfully!");
        }
    } else {
        console.log("App not found. Creating new app...");
        const { error } = await supabase
            .from('os_apps')
            .insert({
                name: appName,
                slug: appSlug,
                schema: schema
            });

        if (error) {
            console.error("Error creating app:", error.message);
        } else {
            console.log("✅ App created successfully!");
        }
    }

    console.log(`\nView your new app at: http://localhost:3000/studio/${appSlug}`);
}

createDemoApp();
