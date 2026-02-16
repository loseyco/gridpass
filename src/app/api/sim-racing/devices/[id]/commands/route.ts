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
        const { command_type, parameters } = body;

        if (!command_type) {
            return NextResponse.json(
                { error: 'Missing required field: command_type' },
                { status: 400 }
            );
        }

        // Verify device belongs to user
        const { data: device, error: deviceError } = await supabase
            .from('os_devices')
            .select('id, user_id, status')
            .eq('id', deviceId)
            .single();

        if (deviceError || !device) {
            return NextResponse.json(
                { error: 'Device not found' },
                { status: 404 }
            );
        }

        if (device.user_id !== user.id) {
            return NextResponse.json(
                { error: 'Forbidden: You do not own this device' },
                { status: 403 }
            );
        }

        // Create command
        const { data: command, error: commandError } = await supabase
            .from('os_device_commands')
            .insert({
                device_id: deviceId,
                issued_by: user.id,
                command_type,
                parameters: parameters || {},
                status: 'pending'
            })
            .select()
            .single();

        if (commandError) {
            console.error('Error creating command:', commandError);
            return NextResponse.json(
                { error: 'Failed to create command' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            command_id: command.id,
            message: `Command '${command_type}' queued for device`
        });

    } catch (error) {
        console.error('Command creation error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
