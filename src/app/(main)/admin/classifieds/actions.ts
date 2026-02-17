'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createClassified(formData: FormData) {
    const supabase = await createClient();

    // Get current user to set as owner
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const title = formData.get('title') as string;
    const price = parseFloat(formData.get('price') as string);
    const description = formData.get('description') as string;
    const category = formData.get('category') as any;
    const status = formData.get('status') as any;
    const imageUrls = (formData.get('images') as string).split(',').map(s => s.trim()).filter(Boolean);
    const contactEmail = formData.get('contact_email') as string;
    const contactPhone = formData.get('contact_phone') as string;

    const { error } = await supabase.from('classifieds').insert({
        user_id: user.id,
        title,
        price,
        description,
        category,
        status,
        images: imageUrls,
        contact_info: { email: contactEmail, phone: contactPhone }
    });

    if (error) {
        console.error('Error creating classified:', error);
        throw new Error('Failed to create listing');
    }

    revalidatePath('/admin/classifieds');
    revalidatePath('/classifieds');
    redirect('/admin/classifieds');
}

export async function updateClassified(id: string, formData: FormData) {
    const supabase = await createClient();

    const title = formData.get('title') as string;
    const price = parseFloat(formData.get('price') as string);
    const description = formData.get('description') as string;
    const category = formData.get('category') as any;
    const status = formData.get('status') as any;
    const imageUrls = (formData.get('images') as string).split(',').map(s => s.trim()).filter(Boolean);
    const contactEmail = formData.get('contact_email') as string;
    const contactPhone = formData.get('contact_phone') as string;

    const { error } = await supabase.from('classifieds').update({
        title,
        price,
        description,
        category,
        status,
        images: imageUrls,
        contact_info: { email: contactEmail, phone: contactPhone },
        updated_at: new Date().toISOString()
    }).eq('id', id);

    if (error) {
        console.error('Error updating classified:', error);
        throw new Error('Failed to update listing');
    }

    revalidatePath('/admin/classifieds');
    revalidatePath('/classifieds');
    revalidatePath(`/classifieds/${id}`);
    redirect('/admin/classifieds');
}

export async function deleteClassified(id: string) {
    const supabase = await createClient();

    const { error } = await supabase.from('classifieds').delete().eq('id', id);

    if (error) {
        console.error('Error deleting classified:', error);
        throw new Error('Failed to delete listing');
    }

    revalidatePath('/admin/classifieds');
    revalidatePath('/classifieds');
}
