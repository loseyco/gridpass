import { BrowserWindow } from 'electron';
import { SupabaseClient } from '@supabase/supabase-js';
import { initAuth } from './auth';
// import { initTelemetry } from './telemetry';
import { initPythonBridge, killPythonBridge } from './python_bridge';
import { initSettings } from './settings';
import { getDeviceId } from './store';
import * as fs from 'fs';
import * as path from 'path';

const LOG_FILE = path.join(process.cwd(), 'desktop_debug.log');
function logToFile(msg: string) {
    fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`);
}

let commandInterval: NodeJS.Timeout | null = null;
const originalConsoleLog = console.log;
console.log = (...args) => {
    originalConsoleLog(...args);
    logToFile(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '));
};

export function initAgent(mainWindow: BrowserWindow, supabase: SupabaseClient) {
    console.log('[Agent] Initializing GridPass Agent (Python Mode)...');

    // 1. Initialize Sub-Systems
    initAuth(mainWindow, supabase);
    // OLD: initTelemetry(supabase, mainWindow);
    initPythonBridge(mainWindow);
    initSettings();

    // 2. Start Command Polling
    startCommandLoop(supabase);

    // 3. Start Auto-Update Check
    // startAutoUpdateCheck();
}

import { executeCommand } from './commands';

function startCommandLoop(supabase: SupabaseClient) {
    if (commandInterval) clearInterval(commandInterval);

    console.log('[Agent] Starting Command Loop...');

    commandInterval = setInterval(async () => {
        const deviceId = getDeviceId();
        if (!deviceId) return; // Not linked

        try {
            // Atomic Poll via RPC
            const { data: commands, error } = await supabase.rpc('poll_device_commands', {
                p_device_id: deviceId
            });

            if (error) {
                console.error('[Agent] Command Poll Error:', error);
                return;
            }

            if (commands && commands.length > 0) {
                console.log(`[Agent] Received ${commands.length} commands.`);

                for (const cmd of commands) {
                    // Execute
                    let status = 'completed';
                    let result = {};

                    try {
                        const success = await executeCommand(cmd.command_type, cmd.command_payload);
                        if (!success) status = 'failed';
                    } catch (ex: any) {
                        status = 'failed';
                        result = { error: ex.message };
                    }

                    // Ack
                    await supabase.rpc('ack_command', {
                        p_command_id: cmd.command_id,
                        p_status: status,
                        p_result: result
                    });
                }
            }

        } catch (e) {
            console.error('[Agent] Command Loop Exception:', e);
        }
    }, 3000);
}

/*
function startAutoUpdateCheck() {
    // Check immediately
    autoUpdater.checkForUpdatesAndNotify();

    // Check every 60 minutes
    setInterval(() => {
        autoUpdater.checkForUpdatesAndNotify();
    }, 60 * 60 * 1000);
}
*/
