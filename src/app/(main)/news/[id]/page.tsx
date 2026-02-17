import { createClient } from '@/utils/supabase/server';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import { Share2, Video, Trophy, ArrowLeft, Calendar } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: summary } = await supabase
        .from('os_daily_summaries')
        .select('title, summary_snippet, content')
        .eq('id', id)
        .single();

    if (!summary) return { title: 'GridPass Daily' };

    // Fallback description if snippet is missing
    const description = summary.summary_snippet ||
        summary.content.replace(/^#\s+.*$/m, '').substring(0, 160).replace(/\n/g, ' ') + '...';

    return {
        title: summary.title || 'GridPass Daily News',
        description: description,
        openGraph: {
            title: summary.title || 'GridPass Daily News',
            description: description,
            type: 'article',
            images: ['/hero-launch.png']
        },
        alternates: {
            canonical: `/news/${id}`
        }
    };
}

export default async function NewsArticlePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: summary } = await supabase
        .from('os_daily_summaries')
        .select('*')
        .eq('id', id)
        .single();

    if (!summary) {
        notFound();
    }

    // Get other recent summaries for sidebar
    const { data: recentSummaries } = await supabase
        .from('os_daily_summaries')
        .select('id, date, created_at, content')
        .neq('id', id)
        .order('created_at', { ascending: false })
        .limit(5);

    return (
        <div className="min-h-screen bg-black text-white selection:bg-red-500/30">
            {/* Header */}
            <header className="border-b border-white/10 sticky top-0 bg-black/80 backdrop-blur-md z-50">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/news" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Back to Today's Briefing</span>
                    </Link>
                    <div className="flex items-center gap-4 text-sm text-zinc-400">
                        <span>{new Date(summary.created_at).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-8 space-y-12">

                {/* Main Content Column */}
                <div className="space-y-8">
                    <article className="group">
                        <div className="flex items-center gap-2 text-zinc-500 font-medium text-sm mb-3">
                            ARCHIVED BRIEFING • {new Date(summary.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>

                        <div className="prose prose-invert prose-red max-w-none 
              prose-headings:font-bold prose-headings:tracking-tight 
              prose-h1:text-4xl prose-h1:mb-6 prose-h1:leading-tight
              prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-l-4 prose-h2:border-red-600 prose-h2:pl-4
              prose-ul:list-disc prose-ul:pl-6 prose-li:marker:text-red-500
              prose-a:text-red-400 prose-a:no-underline hover:prose-a:underline
              bg-zinc-900/30 p-8 rounded-2xl border border-white/5 shadow-xl">

                            <h1 className="text-4xl font-bold mb-6 text-red-500">{summary.title || "GridPass Daily Briefing"}</h1>
                            <p className="text-xl text-zinc-300 mb-8 italic">{summary.summary_snippet}</p>

                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeSlug]}
                                components={{
                                    h1: ({ node, ...props }) => <h1 className="text-3xl font-bold text-red-500 mt-8 mb-4 border-b border-red-500/20 pb-2" {...props} />,
                                    h2: ({ node, ...props }) => <h2 className="text-2xl font-bold text-white mt-10 mb-4 flex items-center gap-2" {...props} />,
                                    h3: ({ node, ...props }) => <h3 className="text-xl font-bold text-zinc-200 mt-6 mb-3" {...props} />,
                                    p: ({ node, ...props }) => <p className="text-zinc-300 leading-relaxed mb-6 text-lg" {...props} />,
                                    ul: ({ node, ...props }) => <ul className="space-y-3 mb-8" {...props} />,
                                    li: ({ node, ...props }) => (
                                        <li className="flex items-start gap-2 text-zinc-300 leading-relaxed pl-2 border-l-2 border-zinc-700 hover:border-red-500 transition-colors" {...props} >
                                            <span className="mt-1.5 w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" />
                                            <span>{props.children}</span>
                                        </li>
                                    ),
                                    strong: ({ node, ...props }) => <strong className="font-bold text-white" {...props} />,
                                    a: ({ node, ...props }) => <a className="text-red-400 hover:text-red-300 underline underline-offset-4 decoration-red-500/30" {...props} />,
                                }}
                            >
                                {summary.content.replace(/^(\*\*|__)(.*?)\1$/gm, '## $2')}
                            </ReactMarkdown>

                            <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-between text-sm text-zinc-500">
                                <div className="flex items-center gap-2">
                                    <Trophy className="w-4 h-4" />
                                    Archived from GridPass Daily
                                </div>
                                <div className="flex gap-4">
                                    <button className="flex items-center gap-2 hover:text-white transition-colors">
                                        <Share2 className="w-4 h-4" /> Share
                                    </button>
                                </div>
                            </div>
                        </div>
                    </article>
                </div>

                {/* Footer Sidebar Stuff */}
                <div className="border-t border-white/10 pt-12">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-zinc-400" />
                        More Briefings
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recentSummaries?.map((s) => (
                            <Link key={s.id} href={`/news/${s.id}`} className="block group">
                                <div className="p-4 rounded-xl bg-zinc-900/30 border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all">
                                    <div className="text-xs text-zinc-500 mb-2">
                                        {new Date(s.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })}
                                    </div>
                                    <div className="font-medium text-base line-clamp-2 group-hover:text-red-400 transition-colors">
                                        {s.content.split('\n')[0].replace(/^#\s+/, '') || 'Daily Racing Update'}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
