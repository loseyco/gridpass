import { app, ipcMain } from 'electron';

export function initSettings() {
    // IPC: Get Startup Status
    ipcMain.handle('get-startup', () => {
        const settings = app.getLoginItemSettings();
        return settings.openAtLogin;
    });

    // IPC: Toggle Startup
    ipcMain.handle('toggle-startup', (_, enable: boolean) => {
        app.setLoginItemSettings({
            openAtLogin: enable,
            openAsHidden: true, // Optional: start minified
            path: app.getPath('exe') // Robustness for Squirrel/production
        });
        return app.getLoginItemSettings().openAtLogin;
    });
}
