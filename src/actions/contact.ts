'use server';

import { z } from 'zod';
import { sendContactEmail } from '@/lib/email';

const contactSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    message: z.string().min(10, 'Message must be at least 10 characters'),
});

export async function submitContactForm(prevState: any, formData: FormData) {
    const data = {
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string,
        email: formData.get('email') as string,
        message: formData.get('message') as string,
    };

    const result = contactSchema.safeParse(data);

    if (!result.success) {
        return {
            success: false,
            errors: result.error.flatten().fieldErrors,
            message: 'Please check the form for errors.'
        };
    }

    try {
        const emailResult = await sendContactEmail(result.data);

        if (emailResult && !emailResult.success) {
            return { success: false, message: 'Failed to send email. Please try again later.' };
        }

        return { success: true, message: 'Message sent successfully!' };
    } catch (error) {
        console.error('Contact form error:', error);
        return { success: false, message: 'Something went wrong. Please try again.' };
    }
}
