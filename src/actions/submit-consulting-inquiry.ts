'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

// Define the shape of the form state
export type FormState = {
    message: string;
    success?: boolean;
    errors?: {
        name?: string[];
        email?: string[];
        message?: string[];
    };
};

export async function submitConsultingInquiry(
    prevState: FormState,
    formData: FormData
): Promise<FormState> {
    const supabase = await createClient();

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const message = formData.get('message') as string;
    const serviceType = (formData.get('serviceType') as string) || 'automotive';

    // Basic validation
    const errors: FormState['errors'] = {};
    if (!name || name.trim().length < 2) {
        errors.name = ['Name is required.'];
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        errors.email = ['Valid email is required.'];
    }
    if (!message || message.trim().length < 10) {
        errors.message = ['Message must be at least 10 characters.'];
    }

    if (Object.keys(errors).length > 0) {
        return { message: 'Please correct the errors below.', errors, success: false };
    }

    try {
        const { error } = await supabase
            .from('consulting_inquiries')
            .insert({
                name,
                email,
                message,
                service_type: serviceType,
                status: 'pending'
            });

        if (error) {
            console.error('Database Error:', error);
            return { message: 'Failed to submit inquiry. Please try again.', success: false };
        }

        return { message: 'Inquiry submitted successfully! PJ will be in touch shortly.', success: true };
    } catch (err) {
        console.error('Server Error:', err);
        return { message: 'An unexpected error occurred.', success: false };
    }
}
