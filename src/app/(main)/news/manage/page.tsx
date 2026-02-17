import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import { Rss, FileText, Video, CheckCircle, Clock, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import TriggerButton from './TriggerButton';
import YouTubeConnect from './YouTubeConnect';
import AddSourceForm from './AddSourceForm';
import SourceList from './SourceList';

export const dynamic = 'force-dynamic';

export default async function NewsManagePage() {
    const supabase = createAdminClient();
    const authClient = await createClient();

    // 1. Auth Check
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
        redirect('/login?next=/news/manage');
    }

    // Strict Access Control
    if (user.email !== 'pjlosey@outlook.com') {
        redirect('/news');
    }

    // Optional: Check for specific email/role if needed
    // if (user.email !== 'pjlosey@gmail.com') { redirect('/news'); }

    const { data: articles } = await supabase
        .from('os_news_articles')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(50);

    const { data: summaries } = await supabase
        .from('os_daily_summaries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    const { data: sources } = await supabase
        .from('os_news_sources')
        .select('*')
        .order('created_at', { ascending: true });

    return (
        <div className="min-h-screen bg-black text-white selection:bg-red-500/30 font-sans">
            <header className="border-b border-white/10 sticky top-0 bg-black/80 backdrop-blur-md z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/news" className="group flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-full border border-white/10 transition-colors">
                            <ChevronLeft className="w-4 h-4 text-zinc-400 group-hover:text-white" />
                            <span className="text-xs font-bold text-zinc-400 group-hover:text-white">Back to News</span>
                        </Link>
                        <div className="h-6 w-px bg-white/10 mx-2" />
                        <span className="font-bold text-xl tracking-tight">GridPass <span className="text-red-500">Newsroom</span></span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                        <YouTubeConnect />
                        <TriggerButton />
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8 space-y-12">

                {/* Sources Section */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Rss className="w-6 h-6 text-red-500" />
                            News Wire Sources
                        </h2>
                        <AddSourceForm />
                    </div>

                    <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
                        <div className="text-sm text-zinc-400 mb-4">
                            Manage the RSS feeds that power the Daily Briefing.
                        </div>
                        <SourceList sources={sources || []} />
                    </div>
                </section>

                {/* Summaries Section */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <FileText className="w-6 h-6 text-red-500" />
                            Generated Briefings
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {summaries?.map((summary) => (
                            <div key={summary.id} className="bg-zinc-900/50 border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="text-zinc-500 text-xs font-mono mb-1">{summary.id}</div>
                                        <div className="font-medium text-red-400">
                                            {new Date(summary.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="px-2 py-1 bg-green-500/10 text-green-500 text-xs rounded border border-green-500/20">
                                        Published
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Article Preview */}
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Article Content</h3>
                                        <div className="h-48 overflow-y-auto bg-black/50 p-3 rounded border border-white/5 text-xs font-mono text-zinc-300 whitespace-pre-wrap">
                                            {summary.content}
                                        </div>
                                    </div>

                                    {/* Video Script Preview */}
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                            <Video className="w-3 h-3" /> Video Script
                                        </h3>
                                        <div className="h-48 overflow-y-auto bg-black/50 p-3 rounded border border-white/5 text-xs font-mono text-green-400 whitespace-pre-wrap">
                                            {summary.video_script || 'No script generated.'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(!summaries || summaries.length === 0) && (
                            <div className="text-center py-12 text-zinc-500 bg-zinc-900/30 rounded-xl border border-dashed border-zinc-800">
                                No briefings generated yet. Trigger the scraper to start.
                            </div>
                        )}
                    </div>
                </section>

                {/* Raw Articles Section */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Rss className="w-6 h-6 text-blue-500" />
                            Incoming Wire
                        </h2>
                        <div className="text-sm text-zinc-500">
                            Showing last 50 items
                        </div>
                    </div>

                    <div className="bg-zinc-900/50 border border-white/5 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white/5 text-zinc-400 font-medium">
                                <tr>
                                    <th className="p-4">Time</th>
                                    <th className="p-4">Source</th>
                                    <th className="p-4">Headline</th>
                                    <th className="p-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {articles?.map((article) => (
                                    <tr key={article.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 text-zinc-500 whitespace-nowrap">
                                            {new Date(article.published_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 bg-white/10 rounded text-xs text-zinc-300">
                                                {article.source_id}
                                            </span>
                                        </td>
                                        <td className="p-4 font-medium text-zinc-200">
                                            <a href={article.url} target="_blank" className="hover:text-blue-400 hover:underline">
                                                {article.title}
                                            </a>
                                        </td>
                                        <td className="p-4 text-right">
                                            {article.is_included_in_summary ?
                                                <span className="inline-flex items-center gap-1 text-green-500 text-xs font-bold">
                                                    <CheckCircle className="w-3 h-3" /> Included
                                                </span> :
                                                <span className="inline-flex items-center gap-1 text-zinc-500 text-xs">
                                                    <Clock className="w-3 h-3" /> Pending
                                                </span>
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {(!articles || articles.length === 0) && (
                            <div className="p-8 text-center text-zinc-500">
                                No articles found in the database.
                            </div>
                        )}
                    </div>
                </section>

            </main>
        </div>
    );
}
