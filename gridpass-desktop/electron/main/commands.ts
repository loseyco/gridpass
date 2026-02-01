import { exec } from 'child_process';
import { sendPythonCommand } from './python_bridge';

export async function executeCommand(type: string, payload: any = {}): Promise<boolean> {
    console.log(`[Commands] Executing: ${type}`, payload);

    switch (type) {
        case 'reboot':
            exec('shutdown /r /t 0');
            return true;
        case 'shutdown':
            exec('shutdown /s /t 0');
            return true;

        case 'reset_car':
            // Broadcast Msg 0 is usually generic, but let's assume we map explicitly later
            // For now, sending a generic broadcast request or chat
            sendPythonCommand({ command: 'broadcast', msg: 0, v1: 0, v2: 0, v3: 0 });
            return true;

        case 'exit_sim':
            // Broadcast Msg to exit? Check SDK.
            // Msg 0x0002 = 2 = Exit?
            sendPythonCommand({ command: 'broadcast', msg: 2, v1: 0, v2: 0, v3: 0 });
            return true;

        case 'chat_message':
            // Need to implement Chat in Python script eventually
            // sendPythonCommand({ command: 'chat', message: payload.message });
            console.warn('Chat not yet implemented in Python Bridge');
            return true;

        default:
            console.warn(`[Commands] Unknown command: ${type}`);
            return false;
    }
}
