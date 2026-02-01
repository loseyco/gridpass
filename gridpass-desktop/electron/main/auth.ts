import { BrowserWindow, ipcMain } from 'electron';
import { SupabaseClient } from '@supabase/supabase-js';
import { getDeviceId, getHardwareId, setDeviceId } from './store';

// Types
type PairingStatus = 'unpaired' | 'pairing' | 'paired';

let status: PairingStatus = 'unpaired';
let pairingCode: string | null = null;
let pollInterval: NodeJS.Timeout | null = null;
let supabase: SupabaseClient | null = null;

export function initAuth(mainWindow: BrowserWindow, sbClient: SupabaseClient) {
    supabase = sbClient;
    const deviceId = getDeviceId();

    // Check if already paired
    if (deviceId) {
        status = 'paired';
        console.log('[Auth] Device already linked:', deviceId);
        mainWindow.webContents.send('auth-status', { status, deviceId });
    } else {
        startPairing(mainWindow);
    }

    // IPC Handlers
    ipcMain.handle('get-auth-status', () => ({ status, pairingCode, deviceId: getDeviceId() }));
    ipcMain.handle('reset-pairing', () => {
        setDeviceId('');
        status = 'unpaired';
        startPairing(mainWindow);
        return { status };
    });
}

async function startPairing(mainWindow: BrowserWindow) {
    if (status === 'paired') return;
    status = 'pairing';

    // 1. Generate local code
    pairingCode = generateShortCode();
    console.log('[Auth] Generated Code:', pairingCode);
    mainWindow.webContents.send('auth-status', { status, pairingCode });

    // 2. Register Handshake with Backend
    const hwId = getHardwareId();
    if (supabase) {
        try {
            const { error } = await supabase.rpc('register_device_handshake', {
                p_hw_id: hwId,
                p_code: pairingCode
            });
            if (error) console.error('[Auth] Handshake Registration Error:', error);
            else console.log('[Auth] Handshake registered on server.');
        } catch (e) {
            console.error('[Auth] RPC Error:', e);
        }
    }

    // 3. Start Polling
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(async () => {
        await checkHandshake(mainWindow);
    }, 3000);
}

async function checkHandshake(mainWindow: BrowserWindow) {
    if (!pairingCode || !supabase) return;
    const hwId = getHardwareId();

    try {
        const { data, error } = await supabase.rpc('get_device_pairing', {
            p_hw_id: hwId
        });

        if (error) {
            console.error('[Auth] Poll Error:', error);
            return;
        }

        if (data && data.status === 'paired') {
            const { device_id } = data; // user_id is also there if needed

            // Success!
            console.log('[Auth] Paired! Device ID:', device_id);
            setDeviceId(device_id);

            // Update State
            status = 'paired';
            pairingCode = null;
            if (pollInterval) clearInterval(pollInterval); // Stop polling

            // Notify UI
            mainWindow.webContents.send('auth-status', { status, deviceId: device_id });
        }
    } catch (e) {
        console.error('[Auth] Poll Exception:', e);
    }
}

function generateShortCode() {
    // Simple 6-char alphanumeric
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, 1, 0, O
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
