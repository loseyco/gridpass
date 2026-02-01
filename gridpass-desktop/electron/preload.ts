import { ipcRenderer, contextBridge } from 'electron'

contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
})

// Secure API for GridPass specific logic
contextBridge.exposeInMainWorld('api', {
  getAuthStatus: () => ipcRenderer.invoke('get-auth-status'),
  resetPairing: () => ipcRenderer.invoke('reset-pairing'),
  onAuthUpdate: (callback: (status: any) => void) => {
    const listener = (_: any, value: any) => callback(value);
    ipcRenderer.on('auth-status', listener);
    return () => ipcRenderer.off('auth-status', listener);
  },
  onTelemetryUpdate: (callback: (data: any) => void) => {
    const listener = (_: any, value: any) => callback(value);
    ipcRenderer.on('telemetry-update', listener);
    return () => ipcRenderer.off('telemetry-update', listener);
  },
  getStartup: () => ipcRenderer.invoke('get-startup'),
  toggleStartup: (enable: boolean) => ipcRenderer.invoke('toggle-startup', enable),
  toggleMock: (enable: boolean) => ipcRenderer.invoke('telemetry:toggle-mock', enable),
  sendTelemetryCommand: (cmd: any) => ipcRenderer.invoke('telemetry:command', cmd)
});
