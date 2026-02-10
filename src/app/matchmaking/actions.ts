'use server'

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { RacingSeat, DriverRequest } from '@/types/matchmaking';

export async function createRacingSeat(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Not authenticated');
    }

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const price = formData.get('price') ? parseFloat(formData.get('price') as string) : null;
    const currency = formData.get('currency') as string || 'USD';
    const event_name = formData.get('event_name') as string;
    const event_date = formData.get('event_date') as string;
    const track_name = formData.get('track_name') as string;

    const make = formData.get('make') as string;
    const model = formData.get('model') as string;
    const car_class = formData.get('class') as string;

    const included_items = (formData.get('included_items') as string)?.split(',').map(s => s.trim()).filter(Boolean) || [];

    const seatData = {
        owner_id: user.id,
        title,
        description,
        price,
        currency,
        event_name,
        event_date: event_date ? new Date(event_date).toISOString() : null,
        track_name,
        car_info: {
            make,
            model,
            class: car_class
        },
        included_items,
        status: 'available'
    };

    const { error } = await supabase.from('racing_seats').insert(seatData);

    if (error) {
        console.error('Error creating racing seat:', error);
        throw new Error('Failed to create listing');
    }

    revalidatePath('/matchmaking');
    redirect('/matchmaking');
}

export async function createDriverRequest(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Not authenticated');
    }

    const title = formData.get('title') as string;
    const bio = formData.get('bio') as string;
    const experience_level = formData.get('experience_level') as string;
    const budget = formData.get('budget') ? parseFloat(formData.get('budget') as string) : null;
    const preferred_region = formData.get('preferred_region') as string;

    const requestData = {
        user_id: user.id,
        title,
        bio,
        experience_level,
        budget,
        preferred_region,
        status: 'active'
    };

    const { error } = await supabase.from('driver_requests').insert(requestData);

    if (error) {
        console.error('Error creating driver request:', error);
        throw new Error('Failed to create request');
    }

    revalidatePath('/matchmaking');
    redirect('/matchmaking');
}
