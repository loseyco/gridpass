import { createClient } from '@/utils/supabase/server';
import { getInquiries } from '@/app/actions/inquiries';
import InquiryList from '@/components/dashboard/inquiries/InquiryList';
import { Briefcase } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
    title: 'Inquiries | GridPass',
    description: 'Manage your service inquiries and job requests.',
};

export default async function InquiriesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch inquiries using server action
    const inquiries = await getInquiries();

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Briefcase className="w-8 h-8 text-indigo-500" />
                        Inquiries
                    </h1>
                    <p className="text-neutral-400 mt-1">
                        Manage incoming job requests and messages from your profile.
                    </p>
                </div>
                <div>
                    <Link
                        href={`/u/${user?.user_metadata?.username || 'me'}`}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        View Public Profile
                    </Link>
                </div>
            </div>

            {/* Inquiries List */}
            <InquiryList initialInquiries={inquiries || []} />
        </div>
    );
}
