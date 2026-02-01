import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';
import { BrowserWindow } from 'electron';

let pythonProcess: ChildProcess | null = null;
let _mainWindow: BrowserWindow | null = null;

export function initPythonBridge(mainWindow: BrowserWindow) {
    _mainWindow = mainWindow;
    console.log('[PythonBridge] Initializing...');

    // Path to python script
    // In dev: resources/python/telemetry.py
    // In prod: needs unpack logic, but focused on dev for now
    const scriptPath = join(process.cwd(), 'resources', 'python', 'telemetry.py');

    console.log('[PythonBridge] Spawning python at:', scriptPath);

    pythonProcess = spawn('python', ['-u', scriptPath]); // -u for unbuffered stdout

    if (pythonProcess.stdout) {
        pythonProcess.stdout.on('data', (data) => {
            const lines = data.toString().split('\n');
            lines.forEach((line: string) => {
                if (!line.trim()) return;
                try {
                    const json = JSON.parse(line);
                    if (json.connected) {
                        // Forward to UI
                        if (_mainWindow && !_mainWindow.isDestroyed()) {
                            _mainWindow.webContents.send('telemetry-update', json);
                        }
                    } else if (json.status) {
                        console.log('[PythonBridge] Status:', json.status);
                    }
                } catch (e) {
                    // console.error('[PythonBridge] Parse Error:', line);
                }
            });
        });
    }

    if (pythonProcess.stderr) {
        pythonProcess.stderr.on('data', (data) => {
            console.error('[PythonBridge] Error:', data.toString());
        });
    }

    pythonProcess.on('close', (code) => {
        console.log(`[PythonBridge] Process exited with code ${code}`);
        pythonProcess = null;
    });
}

export function killPythonBridge() {
    if (pythonProcess) {
        pythonProcess.kill();
        pythonProcess = null;
    }
}

export function sendPythonCommand(command: any) {
    if (pythonProcess && pythonProcess.stdin) {
        try {
            console.log('[PythonBridge] Sending Command:', command);
            const line = JSON.stringify(command) + '\n';
            pythonProcess.stdin.write(line);
        } catch (e) {
            console.error('[PythonBridge] Send Error:', e);
        }
    } else {
        console.warn('[PythonBridge] Cannot send command: Process not running');
    }
}
