import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        let user = null;
        let supabaseForDb = null;

        // Try Bearer token authentication first (for Python client)
        const authHeader = request.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);

            const supabaseWithToken = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                {
                    global: {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                }
            );

            const { data: { user: tokenUser }, error } = await supabaseWithToken.auth.getUser();
            if (tokenUser && !error) {
                user = tokenUser;
                supabaseForDb = supabaseWithToken;
            }
        }

        // Fall back to cookie-based auth (for browser)
        if (!user) {
            const supabaseFromCookies = await createServerClient();
            const { data: { user: cookieUser }, error } = await supabaseFromCookies.auth.getUser();
            if (cookieUser && !error) {
                user = cookieUser;
                supabaseForDb = supabaseFromCookies;
            }
        }

        if (!user || !supabaseForDb) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const {
            name,
            hardware_fingerprint,
            pc_specs
        } = body;

        // Validate required fields
        if (!name || !hardware_fingerprint) {
            return NextResponse.json(
                { error: 'Missing required fields: name, hardware_fingerprint' },
                { status: 400 }
            );
        }

        // Check if device already exists
        const { data: existingDevice } = await supabaseForDb
            .from('os_devices')
            .select('id')
            .eq('hardware_fingerprint', hardware_fingerprint)
            .single();

        let device;

        if (existingDevice) {
            // Update existing device
            const { data, error } = await supabaseForDb
                .from('os_devices')
                .update({
                    name,
                    user_id: user.id,
                    cpu_model: pc_specs?.cpu_model,
                    ram_gb: pc_specs?.ram_gb,
                    gpu_model: pc_specs?.gpu_model,
                    os_version: pc_specs?.os_version,
                    status: 'online',
                    last_heartbeat: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', existingDevice.id)
                .select()
                .single();

            if (error) {
                console.error('Error updating device:', error);
                return NextResponse.json(
                    { error: 'Failed to update device' },
                    { status: 500 }
                );
            }

            device = data;
        } else {
            // Create new device
            const { data, error } = await supabaseForDb
                .from('os_devices')
                .insert({
                    user_id: user.id,
                    name,
                    hardware_fingerprint,
                    cpu_model: pc_specs?.cpu_model,
                    ram_gb: pc_specs?.ram_gb,
                    gpu_model: pc_specs?.gpu_model,
                    os_version: pc_specs?.os_version,
                    status: 'online',
                    last_heartbeat: new Date().toISOString()
                })
                .select()
                .single();

            if (error) {
                console.error('Error creating device:', error);
                return NextResponse.json(
                    { error: 'Failed to register device' },
                    { status: 500 }
                );
            }

            device = data;
        }

        // Handle clear_commands flag (Only clear STALE commands > 5 mins old)
        if (body.clear_commands && device) {
            console.log(`[REGISTER] Clearing STALE pending commands for device ${device.id}`);

            // Calculate stale threshold (5 minutes ago)
            const staleThreshold = new Date(Date.now() - 5 * 60 * 1000).toISOString();

            const { error: clearError } = await supabaseForDb
                .from('os_device_commands')
                .update({
                    status: 'cancelled',
                    completed_at: new Date().toISOString()
                })
                .eq('device_id', device.id)
                .eq('status', 'pending')
                .lt('created_at', staleThreshold); // Only clear if older than threshold

            if (clearError) {
                console.error('[REGISTER] Failed to clear commands:', clearError);
            }
        }

        return NextResponse.json({
            success: true,
            device_id: device.id,
            message: existingDevice ? 'Device updated' : 'Device registered'
        });

    } catch (error) {
        console.error('Device registration error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
