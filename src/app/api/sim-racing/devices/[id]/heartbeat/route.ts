import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        let user = null;
        let supabase = null;

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
                supabase = supabaseWithToken;
            }
        }

        // Fall back to cookie-based auth (for browser)
        if (!user) {
            const supabaseFromCookies = await createServerClient();
            const { data: { user: cookieUser }, error } = await supabaseFromCookies.auth.getUser();
            if (cookieUser && !error) {
                user = cookieUser;
                supabase = supabaseFromCookies;
            }
        }

        if (!user || !supabase) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id: deviceId } = await params;
        const body = await request.json();
        const { status, telemetry } = body;

        // Verify device belongs to user
        const { data: device, error: deviceError } = await supabase
            .from('os_devices')
            .select('id, user_id')
            .eq('id', deviceId)
            .single();

        if (deviceError || !device) {
            console.error('[HEARTBEAT] Device lookup failed:', {
                deviceId,
                userId: user.id,
                error: deviceError
            });
            return NextResponse.json(
                { error: 'Device not found', details: deviceError?.message },
                { status: 404 }
            );
        }

        if (device.user_id !== user.id) {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            );
        }

        // Update device heartbeat
        await supabase
            .from('os_devices')
            .update({
                status: status || 'online',
                last_heartbeat: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                telemetry: telemetry || {}
            })
            .eq('id', deviceId);

        // Get pending commands
        const { data: commands, error: commandsError } = await supabase
            .from('os_device_commands')
            .select('id, command_type, parameters, created_at')
            .eq('device_id', deviceId)
            .eq('status', 'pending')
            .order('created_at', { ascending: true });

        if (commandsError) {
            console.error('Error fetching commands:', commandsError);
        }

        // Mark commands as executing
        if (commands && commands.length > 0) {
            const commandIds = commands.map(cmd => cmd.id);
            await supabase
                .from('os_device_commands')
                .update({
                    status: 'executing',
                    started_at: new Date().toISOString()
                })
                .in('id', commandIds);
        }

        return NextResponse.json({
            success: true,
            commands: commands || [],
            telemetry_received: !!telemetry
        });

    } catch (error) {
        console.error('Heartbeat error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
