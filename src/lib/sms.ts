import twilio from 'twilio';

// Initialize Twilio Client
// These must be set in your .env.local file
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER || '+12249002445'; // Default to the one provided

const client = (accountSid && authToken)
    ? twilio(accountSid, authToken)
    : null;

export async function sendSMSNotification({ to, message }: { to: string; message: string }) {
    if (!client) {
        console.warn('Twilio client not initialized. Missing SID or Token. SMS skipped.');
        // In development, might want to just log it
        if (process.env.NODE_ENV === 'development') {
            console.log(`[MOCK SMS] To: ${to} | Message: ${message}`);
        }
        return { success: false, error: 'Configuration missing' };
    }

    try {
        const result = await client.messages.create({
            body: message,
            from: twilioNumber,
            to: to,
        });

        console.log(`SMS sent to ${to}. SID: ${result.sid}`);
        return { success: true, sid: result.sid };
    } catch (error: any) {
        console.error('Failed to send SMS:', error);
        return { success: false, error: error.message };
    }
}
