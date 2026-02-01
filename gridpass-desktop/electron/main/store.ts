import Store from 'electron-store';
import { randomUUID } from 'node:crypto';

interface Schema {
    deviceId: string;
    hardwareId: string;
    pairingCode?: string;
}

// Singleton store instance
let store: Store<Schema>;

export function getStore() {
    if (!store) {
        store = new Store<Schema>({
            defaults: {
                deviceId: '',
                hardwareId: '',
            },
        });
    }
    return store;
}

// Generate Hardware ID (Mock for now, can improve with machine-id later)
export function getHardwareId(): string {
    const s = getStore();
    let hwId = s.get('hardwareId');
    if (!hwId) {
        hwId = `hw_${randomUUID().split('-')[0]}`; // Simple persistent ID
        s.set('hardwareId', hwId);
    }
    return hwId;
}

export function getDeviceId(): string {
    return getStore().get('deviceId');
}

export function setDeviceId(id: string) {
    getStore().set('deviceId', id);
}

// Reset identity (Debug only)
export function resetIdentity() {
    getStore().clear();
}
