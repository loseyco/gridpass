'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Globe, Rss } from 'lucide-react';
import DailyBriefingHeader from './DailyBriefingHeader';

interface NewsData {
    summary: {
        title: string;
        content: string;
        created_at: string;
    } | null;
    articles: {
        id: string;
        title: string;
        source_id: string;
        published_at: string;
        category: string;
    }[];
}

export default function NewsScene() {
    const [data, setData] = useState<NewsData | null>(null);
    const [featureIndex, setFeatureIndex] = useState(0);

    useEffect(() => {
        // Fetch news data
        fetch('/api/live/news')
            .then((res) => res.json())
            .then((data) => setData(data))
            .catch((err) => console.error('Failed to fetch news:', err));
    }, []);

    // Rotate featured story every 10 seconds
    useEffect(() => {
        if (!data?.articles?.length) return;
        const interval = setInterval(() => {
            setFeatureIndex((prev) => (prev + 1) % Math.min(5, data.articles.length));
        }, 10000);
        return () => clearInterval(interval);
    }, [data]);

    if (!data) return <div className="text-white text-4xl animate-pulse p-24">Loading Intelligence Feed...</div>;

    const featuredArticle = data?.articles[featureIndex];
    const headlines = data?.articles.slice(5) || [];

    return (
        <div className="w-full h-full bg-slate-900 flex flex-col relative overflow-hidden">
            {/* Header */}
            <DailyBriefingHeader activeCategory={featuredArticle?.category || 'HEADLINES'} />

            <div className="flex-1 flex p-12 gap-12 relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-red-900/20 to-transparent"></div>

                {/* LEFT: Featured Story (Carousel) */}
                <div className="flex-1 flex flex-col justify-end relative z-10 pb-12 pl-12">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={featureIndex}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1 }}
                            className="absolute inset-0 z-0"
                        >
                            {/* Background Image with Gradient Overlay */}
                            <img
                                src={`https://images.unsplash.com/photo-1541348263347-37505d96251f?auto=format&fit=crop&q=80&sig=${featureIndex}`} // Mock image for now
                                className="w-full h-full object-cover opacity-60"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
                        </motion.div>
                    </AnimatePresence>

                    <div className="relative z-10">
                        <div className="bg-red-600 text-white text-sm font-bold uppercase tracking-widest px-3 py-1 self-start mb-6 rounded inline-block">
                            Top Story • {featuredArticle?.category || 'General'}
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={featureIndex}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.5 }}
                                className="space-y-6 max-w-4xl"
                            >
                                <h1 className="text-7xl font-black text-white leading-tight drop-shadow-2xl">
                                    {featuredArticle?.title}
                                </h1>
                                <div className="flex items-center gap-4 text-slate-300 text-xl font-bold bg-black/50 inline-flex px-4 py-2 rounded">
                                    <span className="flex items-center gap-2">
                                        <Globe className="w-5 h-5" /> {featuredArticle?.source_id}
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-2">
                                        <Calendar className="w-5 h-5" /> {new Date(featuredArticle?.published_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Progress Indicators */}
                    <div className="flex gap-2 mt-12 relative z-10">
                        {data.articles.slice(0, 5).map((_, i) => (
                            <div
                                key={i}
                                className={`h-2 rounded-full transition-all duration-300 ${i === featureIndex ? 'w-16 bg-red-500' : 'w-4 bg-slate-600'}`}
                            />
                        ))}
                    </div>
                </div>

                {/* RIGHT: Scrolling Headlines (Vertical Ticker) */}
                <div className="w-1/3 bg-slate-950/80 backdrop-blur-md border border-white/10 p-8 flex flex-col relative z-20 shadow-2xl rounded-xl">
                    <div className="flex-1 overflow-hidden relative group">
                        <div className="animate-vertical-scroll space-y-6">
                            {[...headlines, ...headlines].map((article, i) => (
                                <div key={`${article.id}-${i}`} className="bg-slate-900 p-6 rounded-xl border border-white/5 shadow-lg hover:border-red-500/50 transition-colors">
                                    <span className="text-red-400 text-xs font-bold uppercase mb-2 block">{article.source_id}</span>
                                    <h4 className="text-xl text-slate-200 font-bold leading-snug">{article.title}</h4>
                                    <div className="mt-3 text-slate-500 text-sm flex justify-between">
                                        <span>{article.category}</span>
                                        <span>{new Date(article.published_at).toLocaleTimeString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
