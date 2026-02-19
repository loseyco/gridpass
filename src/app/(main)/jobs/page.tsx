import { createClient } from '@/utils/supabase/server';
import { Metadata } from 'next';
import JobBoardClient from './JobBoardClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: "Find Work | GridPass",
    description: "The hub for motorsports opportunities. Find gigs, full-time jobs, and contracts.",
};

export default async function JobsPage() {
    const supabase = await createClient();

    // Fetch Full-Time Jobs (Recruiter Posts)
    const { data: jobs } = await supabase
        .from('os_jobs')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

    // Fetch Gigs (User 'Urgent Needs')
    const { data: gigs } = await supabase
        .from('os_gigs')
        .select('*')
        .eq('status', 'open')
        .order('is_urgent', { ascending: false })
        .order('created_at', { ascending: false });

    // Fetch Candidates (Open to Work)
    const { data: candidates } = await supabase
        .from('os_user_profiles')
        .select('*')
        .eq('is_open_to_work', true)
        .order('updated_at', { ascending: false });

    return (
        <JobBoardClient
            jobs={jobs || []}
            gigs={gigs || []}
            candidates={candidates || []}
        />
    );
}
