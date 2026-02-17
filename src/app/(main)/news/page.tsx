import { createClient } from '@/utils/supabase/server';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Calendar, Share2, Video, Trophy, ArrowRight, Rss, Zap, Flag, Timer, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import GithubSlugger from 'github-slugger';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'News',
    description: 'Latest headlines and daily briefings from the world of motorsports.',
    openGraph: {
        images: ['/hero-launch.png'],
    },
}

export const revalidate = 60; // Revalidate every minute

// Define props for Server Component
interface NewsPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function NewsPage(props: NewsPageProps) {
    const searchParams = await props.searchParams;
    const category = typeof searchParams.category === 'string' ? searchParams.category : undefined;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Get the latest summary (filtered by category if present)
    let query = supabase
        .from('os_daily_summaries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (category && category !== 'All') {
        query = query.eq('category', category);
    }

    const { data: latestSummary } = await query.single();

    // Get recent summaries
    let recentQuery = supabase
        .from('os_daily_summaries')
        .select('id, date, created_at, content, title, category')
        .neq('id', latestSummary?.id || '00000000-0000-0000-0000-000000000000')
        .order('created_at', { ascending: false })
        .limit(6);

    if (category && category !== 'All') {
        recentQuery = recentQuery.eq('category', category);
    }

    const { data: recentSummaries } = await recentQuery;

    // Extract headlines for the ticker from the latest summary content
    // Looks for lines starting with '##' or bold text
    const headlines = latestSummary?.content
        .split('\n')
        .filter((line: string) => line.startsWith('##') || line.startsWith('**'))
        .map((line: string) => line.replace(/^##\s+|^\*\*\s*|\s*\*\*$/g, ''))
        .slice(0, 5) || ["No breaking news at this moment."];

    const slugger = new GithubSlugger();

    return (
        <div className="min-h-screen bg-black text-white selection:bg-red-600 selection:text-white font-sans">

            {/* Breaking News Ticker */}
            <div className="bg-red-600 text-white text-xs font-bold py-1 overflow-hidden relative z-30 border-b border-red-800 md:pt-16">
                <div className="flex items-center gap-4 animate-marquee whitespace-nowrap">
                    <span className="bg-white text-red-600 px-2 py-0.5 -skew-x-12 inline-block mx-4 shadow-sm">BREAKING</span>
                    {headlines.map((h: string, i: number) => (
                        <span key={i} className="flex items-center gap-4">
                            {h} <span className="text-red-300">•</span>
                        </span>
                    ))}
                    <span className="bg-white text-red-600 px-2 py-0.5 -skew-x-12 inline-block mx-4 shadow-sm">BREAKING</span>
                    {headlines.map((h: string, i: number) => (
                        <span key={`dup-${i}`} className="flex items-center gap-4">
                            {h} <span className="text-red-300">•</span>
                        </span>
                    ))}
                </div>
            </div>

            {/* Navbar / Header */}
            <header className="border-b border-white/10 bg-zinc-950/90 backdrop-blur-md sticky top-16 z-40">
                <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="flex flex-col transform -skew-x-6 select-none">
                                <span className="font-black text-lg italic tracking-tighter leading-none text-white">GRID<span className="text-red-500">PASS</span></span>
                                <span className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase">Daily Briefing</span>
                            </div>
                        </div>

                        {/* Admin Link - Explicit Button */}
                        {user?.email?.toLowerCase().trim() === 'pjlosey@outlook.com' && (
                            <Link href="/news/manage" className="flex items-center gap-1.5 px-2 py-0.5 bg-red-600/10 border border-red-600/50 rounded text-[10px] font-bold text-red-500 hover:bg-red-600 hover:text-white transition-colors uppercase tracking-wider">
                                <Flag className="w-3 h-3" />
                                Manage
                            </Link>
                        )}
                    </div>

                    <div className="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-wider text-zinc-400">
                        <Link href="/news" className={`transition-colors hover:text-white ${!category || category === 'All' ? 'text-white border-b-2 border-red-500 pb-3 pt-3' : ''}`}>Headlines</Link>
                        <Link href="/news?category=F1" className={`transition-colors hover:text-white ${category === 'F1' ? 'text-white border-b-2 border-red-500 pb-3 pt-3' : ''}`}>F1</Link>
                        <Link href="/news?category=NASCAR" className={`transition-colors hover:text-white ${category === 'NASCAR' ? 'text-white border-b-2 border-red-500 pb-3 pt-3' : ''}`}>NASCAR</Link>
                        <Link href="/news?category=IndyCar" className={`transition-colors hover:text-white ${category === 'IndyCar' ? 'text-white border-b-2 border-red-500 pb-3 pt-3' : ''}`}>IndyCar</Link>
                        <Link href="/news?category=Sim Racing" className={`transition-colors hover:text-white ${category === 'Sim Racing' ? 'text-white border-b-2 border-red-500 pb-3 pt-3' : ''}`}>Sim Racing</Link>
                        <Link href="/news?category=Automotive" className={`transition-colors hover:text-white ${category === 'Automotive' ? 'text-white border-b-2 border-red-500 pb-3 pt-3' : ''}`}>Automotive</Link>
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500 bg-zinc-900/50 px-2 py-0.5 rounded border border-white/5">
                        {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-4 pb-32">

                {/* Bento Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 grid-auto-rows-[minmax(100px,auto)]">

                    {/* HUGE HERO CARD (Span 8) */}
                    <div className="lg:col-span-8 bg-zinc-900/40 rounded-3xl border border-white/10 overflow-hidden relative group min-h-[500px] flex flex-col">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 opacity-[0.03]"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-10"></div>

                        {/* Decorative Red Line */}
                        <div className="absolute top-0 left-0 w-2 h-full bg-red-600 z-20"></div>

                        <div className="relative z-20 p-8 md:p-12 flex flex-col h-full justify-between">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-3">
                                    <span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded transform -skew-x-12">
                                        Cover Story
                                    </span>
                                    <div className="flex items-center gap-2 text-red-500 text-xs font-bold animate-pulse">
                                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                        LIVE BRIEFING
                                    </div>
                                </div>

                                <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter text-white drop-shadow-lg leading-none">
                                    {latestSummary?.title || "GRIDPASS DAILY INTELLIGENCE"}
                                </h1>
                            </div>

                            <div className="space-y-8 mt-8">
                                <div className="prose prose-invert prose-lg max-w-none text-zinc-300 line-clamp-[10] md:line-clamp-[15] leading-relaxed">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {latestSummary?.content.replace(/^#\s+.*$/m, '') || ''}
                                    </ReactMarkdown>
                                </div>

                                <div className="flex flex-wrap gap-4 pt-6 border-t border-white/10">
                                    <Link href={`/news/${latestSummary?.id}`} className="flex-1 md:flex-none">
                                        <button className="w-full md:w-auto bg-white text-black font-black uppercase italic tracking-wider px-8 py-3 rounded transform -skew-x-12 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 group">
                                            <span className="transform skew-x-12 inline-flex items-center gap-2">
                                                Read Full Report <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </span>
                                        </button>
                                    </Link>
                                    <button className="flex-1 md:flex-none border border-white/20 text-white font-bold uppercase tracking-wider px-6 py-3 rounded transform -skew-x-12 hover:bg-white/5 transition-all flex items-center justify-center gap-2">
                                        <span className="transform skew-x-12 inline-flex items-center gap-2">
                                            <Share2 className="w-4 h-4" /> Share
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SIDEBAR WIDGETS (Span 4) */}
                    <div className="lg:col-span-4 space-y-6 flex flex-col">

                        {/* Video / Multimedia Card */}
                        <Link href={`/news/${latestSummary?.id}`} className="block group">
                            <div className="bg-zinc-900 rounded-2xl p-6 border border-white/10 relative overflow-hidden transition-all hover:border-red-500/30">
                                <div className="absolute top-0 right-0 p-4 opacity-50">
                                    <Video className="w-12 h-12 text-zinc-800 transform rotate-12" />
                                </div>
                                <h3 className="font-bold uppercase tracking-wider text-sm text-zinc-500 mb-4">Daily Debrief</h3>
                                <div className="aspect-video bg-black rounded-xl border border-white/10 flex items-center justify-center relative group-hover:border-red-500/50 transition-colors">
                                    <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(220,38,38,0.5)] group-hover:scale-110 transition-transform cursor-pointer">
                                        <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1"></div>
                                    </div>
                                    <div className="absolute bottom-3 right-3 bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono border border-white/10">01:00</div>
                                </div>
                                <p className="mt-4 text-sm font-medium text-zinc-300 line-clamp-2 group-hover:text-white transition-colors">
                                    {latestSummary?.video_script
                                        ? "Watch the 60-second visual recap of today's top stories."
                                        : "Video summary generating..."}
                                </p>
                            </div>
                        </Link>

                        {/* Top Stories List */}
                        <div className="bg-gradient-to-b from-zinc-900 to-black rounded-2xl border border-white/10 flex-1 p-6 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-transparent"></div>
                            <h3 className="font-black text-xl italic uppercase mb-6 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-red-500" /> Top Stories
                            </h3>
                            <div className="space-y-4">
                                {headlines.slice(0, 4).map((h: string, i: number) => {
                                    const slug = slugger.slug(h);
                                    return (
                                        <Link key={i} href={`/news/${latestSummary?.id}#${slug}`} className="group cursor-pointer block">
                                            <div className="flex items-start gap-3">
                                                <span className="text-red-600 font-mono text-xs pt-1">0{i + 1}</span>
                                                <p className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors leading-snug">
                                                    {h}
                                                </p>
                                            </div>
                                            {i < 3 && <div className="h-px bg-white/5 mt-3 ml-7"></div>}
                                        </Link>
                                    );
                                })}
                            </div>
                            <div className="mt-6 pt-4 border-t border-white/5 text-center">
                                <button className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">View All Headlines</button>
                            </div>
                        </div>
                    </div>

                    {/* ARCHIVE ROW (Span 12) */}
                    <div className="lg:col-span-12 mt-8">
                        <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                            <h2 className="text-2xl font-black italic uppercase tracking-tight flex items-center gap-3">
                                <Timer className="w-6 h-6 text-red-600" />
                                Previous Sessions
                            </h2>
                            <Link href="/news/archive" className="text-sm font-bold uppercase tracking-wider text-red-500 hover:text-white transition-colors flex items-center gap-1">
                                Full Archive <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {recentSummaries?.map((summary, idx) => (
                                <Link key={summary.id} href={`/news/${summary.id}`} className="group">
                                    <div className="bg-zinc-900 border-l-2 border-transparent hover:border-l-red-500 bg-gradient-to-br from-zinc-900 to-black p-5 h-full rounded-r-xl border-y border-r border-white/5 hover:border-white/20 transition-all flex flex-col justify-between group-hover:-translate-y-1">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-start">
                                                <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest bg-zinc-950 px-2 py-1 rounded">
                                                    Session {idx + 1}
                                                </span>
                                                <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                            </div>
                                            <h4 className="font-bold text-sm text-white leading-snug line-clamp-3 group-hover:text-red-400 transition-colors">
                                                {summary.content.split('\n')[0].replace(/^#\s+/, '') || 'Daily Update'}
                                            </h4>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-zinc-500 font-mono">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(summary.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* PROMO BAND Removed */}

                </div>
            </main>
        </div >
    );
}
