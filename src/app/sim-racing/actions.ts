'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function switchClientEnvironment(env: 'local' | 'production', localUrl: string = "http://192.168.86.53:3000/api") {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // Get all user devices
    const { data: devices } = await supabase
        .from('os_devices')
        .select('id')
        .eq('user_id', user.id);

    if (!devices || devices.length === 0) return { error: 'No devices found' };

    // Create command for each device
    const commands = devices.map(device => ({
        device_id: device.id,
        issued_by: user.id,
        command_type: 'set_environment',
        parameters: { env, local_url: localUrl },
        status: 'pending'
    }));

    const { error } = await supabase
        .from('os_device_commands')
        .insert(commands);

    if (error) {
        console.error('Failed to send commands:', error);
        return { error: 'Failed to send commands' };
    }

    revalidatePath('/sim-racing');
    return { success: true, count: devices.length };
}
