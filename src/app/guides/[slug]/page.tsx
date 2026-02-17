import { getGuideBySlug, getAllGuides } from '@/lib/guides';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import { ArrowLeft, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming you have a utils file, otherwise remove cn

interface GuideParams {
    params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
    const guides = getAllGuides();
    return guides.map((guide) => ({
        slug: guide.slug,
    }));
}

export async function generateMetadata({ params }: GuideParams) {
    const slug = (await params).slug;
    const guide = getGuideBySlug(slug);
    return {
        title: `${guide.title} - GridPass Guide`,
        description: guide.description,
    };
}

export default async function GuidePost({ params }: GuideParams) {
    const slug = (await params).slug;
    const guide = getGuideBySlug(slug);

    // Calculate staleness
    const lastUpdatedDate = new Date(guide.last_updated);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastUpdatedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isStale = diffDays > 90; // 3 months

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8 pt-24 max-w-4xl mx-auto">
            <Link href="/guides" className="inline-flex items-center text-zinc-500 hover:text-white mb-8 transition-colors group">
                <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Back to Guides
            </Link>

            <header className="mb-12 border-b border-zinc-800 pb-8">
                <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2 py-1 bg-zinc-800 text-zinc-300 text-xs font-bold uppercase rounded tracking-wider">
                        {guide.category}
                    </span>
                    <span className={cn(
                        "px-2 py-1 text-xs font-bold uppercase rounded tracking-wider",
                        guide.status === 'Live' ? "bg-green-900/30 text-green-400" :
                            guide.status === 'Beta' ? "bg-blue-900/30 text-blue-400" :
                                "bg-orange-900/30 text-orange-400"
                    )}>
                        {guide.status}
                    </span>
                </div>

                <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-white">
                    {guide.title}
                </h1>

                <div className="flex items-center text-sm text-zinc-500 gap-6">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Last Updated: {guide.last_updated}</span>
                    </div>

                    {isStale ? (
                        <div className="flex items-center gap-2 text-yellow-500">
                            <AlertTriangle className="h-4 w-4" />
                            <span>Potentially Outdated ({diffDays} days ago)</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Up to date</span>
                        </div>
                    )}
                </div>
            </header>

            {isStale && (
                <div className="mb-8 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 shrink-0" />
                    <div>
                        <h4 className="font-bold text-yellow-500 mb-1">Check for Updates</h4>
                        <p className="text-sm text-yellow-200/80">
                            This guide hasn't been updated in over 3 months. Features may have changed.
                        </p>
                    </div>
                </div>
            )}

            <article className="prose prose-invert prose-zinc max-w-none 
        prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-white
        prose-h1:text-3xl prose-h2:text-2xl prose-h2:border-b prose-h2:border-zinc-800 prose-h2:pb-2 prose-h2:mt-12
        prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
        prose-strong:text-white
        prose-ul:list-disc prose-ul:pl-6
        prose-li:marker:text-zinc-500
      ">

                {/* Render Content with Custom Components if needed, or just better styles via prose */}
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        // Example of overriding a component
                        blockquote: ({ node, ...props }) => (
                            <blockquote className="border-l-4 border-blue-500 pl-4 py-1 my-4 bg-blue-900/10 italic text-zinc-300" {...props} />
                        ),
                        table: ({ node, ...props }) => (
                            <div className="overflow-x-auto my-8">
                                <table className="min-w-full text-left text-sm" {...props} />
                            </div>
                        ),
                        thead: ({ node, ...props }) => (
                            <thead className="bg-zinc-900 text-white font-bold" {...props} />
                        ),
                        th: ({ node, ...props }) => (
                            <th className="px-4 py-3 border-b border-zinc-800" {...props} />
                        ),
                        td: ({ node, ...props }) => (
                            <td className="px-4 py-3 border-b border-zinc-800 text-zinc-400" {...props} />
                        ),
                    }}
                >
                    {guide.content}
                </ReactMarkdown>

            </article>

            <div className="mt-24 pt-8 border-t border-zinc-900 text-center">
                <p className="text-zinc-600 text-sm">
                    GridPass Documentation • {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
}
