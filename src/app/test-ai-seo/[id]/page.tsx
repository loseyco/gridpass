
import { createClient } from '@/utils/supabase/server';

export default async function MockEventPage({ params }: { params: { id: string } }) {
    const { id } = await params;

    return (
        <div>
            <h1>Event {id}</h1>
            <p>Racing details here.</p>
        </div>
    );
}
