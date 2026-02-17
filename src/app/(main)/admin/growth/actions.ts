'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function convertToJob(listingId: string) {
    const supabase = await createClient();

    // Get the listing
    const { data: listing } = await supabase
        .from('scraped_listings')
        .select('*')
        .eq('id', listingId)
        .single();

    if (!listing) throw new Error('Listing not found');

    // Create a Job
    const { error } = await supabase.from('jobs').insert({
        team_name: listing.origin_author_name || 'Unknown Team',
        role: listing.title || 'Driver',
        description: listing.description,
        source_post_id: listing.id,
        source_link: listing.origin_url,
        status: 'open'
    });

    if (error) {
        console.error('Failed to create job:', error);
        throw new Error('Failed to convert');
    }

    // Mark scraping as processed
    await supabase.from('scraped_listings').update({ status: 'processed' }).eq('id', listingId);

    revalidatePath('/admin/growth');
    revalidatePath('/jobs');
}

export async function convertToClassified(listingId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Get the listing
    const { data: listing } = await supabase
        .from('scraped_listings')
        .select('*')
        .eq('id', listingId)
        .single();

    if (!listing) throw new Error('Listing not found');

    // Create Classified
    // Note: We assign it to the current admin user (or a system user if we had one)
    // Ideally we invite the original user to claim it, but for now we host it.

    const { error } = await supabase.from('classifieds').insert({
        user_id: user?.id,
        title: listing.title || 'Untitled Item',
        description: listing.description,
        price: listing.price || 0,
        category: 'parts', // Default
        status: 'active',
        contact_info: { url: listing.origin_url }
    });

    if (error) {
        console.error('Failed to create classified:', error);
        throw new Error('Failed to convert');
    }

    // Mark scraping as processed
    await supabase.from('scraped_listings').update({ status: 'processed' }).eq('id', listingId);

    revalidatePath('/admin/growth');
    revalidatePath('/classifieds');
}

export async function discardListing(listingId: string) {
    const supabase = await createClient();
    await supabase.from('scraped_listings').update({ status: 'discarded' }).eq('id', listingId);
    revalidatePath('/admin/growth');
}
