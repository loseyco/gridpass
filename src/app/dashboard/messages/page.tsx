import { createClient } from '@/utils/supabase/server';
import { Mail, Clock, User } from 'lucide-react';

export default async function MessagesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: messages } = await supabase
        .from('profile_messages')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false });

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Mail className="w-8 h-8 text-indigo-500" />
                    inbox
                </h1>
                <p className="text-neutral-400">Direct inquiries from your profile.</p>
            </div>

            <div className="space-y-4">
                {messages && messages.length > 0 ? (
                    messages.map((msg) => (
                        <div key={msg.id} className="bg-neutral-900/50 border border-white/5 rounded-xl p-6 transition-all hover:border-indigo-500/30">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white">{msg.sender_name}</h3>
                                        <p className="text-sm text-neutral-400">{msg.sender_email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-neutral-500">
                                    <Clock className="w-3 h-3" />
                                    {new Date(msg.created_at).toLocaleDateString()}
                                </div>
                            </div>

                            <div className="bg-neutral-950 p-4 rounded-lg text-neutral-300 whitespace-pre-wrap border border-white/5">
                                {msg.content}
                            </div>

                            <div className="mt-4 flex justify-end gap-3">
                                <a
                                    href={`mailto:${msg.sender_email}?subject=RE: Your Inquiry`}
                                    className="text-sm font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-2"
                                >
                                    Reply via Email &rarr;
                                </a>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 border border-dashed border-white/10 rounded-xl">
                        <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-500">
                            <Mail className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-neutral-300">No messages yet</h3>
                        <p className="text-neutral-500">When someone contacts you via your profile, it will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
