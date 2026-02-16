import webpush from 'web-push';

// VAPID keys should be generated once and stored in .env.local
// npx web-push generate-vapid-keys
const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

if (publicVapidKey && privateVapidKey) {
    webpush.setVapidDetails(
        'mailto:support@gridpass.app', // TODO: Update with real support email
        publicVapidKey,
        privateVapidKey
    );
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
