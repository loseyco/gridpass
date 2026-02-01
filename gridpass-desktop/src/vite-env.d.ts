/// <reference types="vite/client" />

interface AuthStatus {
    status: 'unpaired' | 'pairing' | 'paired';
    pairingCode?: string;
    deviceId: string;
}

interface Window {
    ipcRenderer: import('electron').IpcRenderer
    api: {
        getAuthStatus: () => Promise<AuthStatus>;
        resetPairing: () => Promise<{ status: string }>;
        onAuthUpdate: (callback: (status: AuthStatus) => void) => () => void;
        getStartup: () => Promise<boolean>;
        toggleStartup: (enable: boolean) => Promise<boolean>;
        toggleMock: (enable: boolean) => Promise<boolean>;
    }
}
