import webpush from 'web-push';

// VAPID keys should be generated once and stored in .env.local
// npx web-push generate-vapid-keys
const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

const cleanKey = (key: string) => {
    return key.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
};

if (publicVapidKey && privateVapidKey) {
    try {
        webpush.setVapidDetails(
            'mailto:support@gridpass.app',
            cleanKey(publicVapidKey),
            cleanKey(privateVapidKey)
        );
    } catch (error) {
        console.error('Failed to set VAPID details:', error);
    }
} else {
    console.warn('VAPID keys are missing. Web Push notifications will not work.');
}

type PushSubscription = {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
};

export async function sendPushNotification(subscription: PushSubscription, payload: string | object) {
    if (!publicVapidKey || !privateVapidKey) {
        return { success: false, error: 'VAPID keys missing' };
    }

    try {
        const stringPayload = typeof payload === 'string' ? payload : JSON.stringify(payload);
        await webpush.sendNotification(subscription, stringPayload);
        return { success: true };
    } catch (error) {
        console.error('Error sending push notification:', error);
        return { success: false, error };
    }
}
