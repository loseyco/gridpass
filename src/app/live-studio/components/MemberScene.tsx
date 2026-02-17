'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

// Define a minimal profile interface
interface Profile {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    created_at: string;
}

export default function MemberScene() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const supabase = createClient();

    useEffect(() => {
        async function fetchNewMembers() {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(3);

            if (data) {
                setProfiles(data);
            }
        }

        fetchNewMembers();
    }, [supabase]);

    return (
        <div className="w-full h-full bg-indigo-950 flex flex-col p-24">
            <div className="flex-1">
                <h2 className="text-4xl text-cyan-400 font-bold mb-12 uppercase tracking-widest">New Members</h2>

                <div className="grid grid-cols-3 gap-12">
                    {profiles.map((profile) => (
                        <div key={profile.id} className="bg-indigo-900/50 p-8 rounded-2xl border border-indigo-700 flex flex-col items-center text-center">
                            <div className="w-48 h-48 rounded-full overflow-hidden mb-6 border-4 border-cyan-500 bg-black">
                                {profile.avatar_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={profile.avatar_url} alt={profile.username || 'User'} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-6xl text-indigo-400">
                                        ?
                                    </div>
                                )}
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-2">@{profile.username || 'Anonymous'}</h3>
                            <p className="text-indigo-300 text-xl">{profile.full_name}</p>
                            <div className="mt-4 px-4 py-2 bg-indigo-800 rounded-full text-indigo-200 text-sm">
                                Joined Recent
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
