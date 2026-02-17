import { createClient } from '@/utils/supabase/server';

export default async function TestPage() {
    const supabase = await createClient();
    const { data: results } = await supabase.from('os_league_race_results').select('*');

    return (
        <div className="p-10 bg-black text-white">
            <h1>Test Page</h1>
            <pre>{JSON.stringify(results, null, 2)}</pre>
        </div>
    );
}
