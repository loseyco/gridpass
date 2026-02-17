import { getGuideBySlug, getAllGuides } from '@/lib/guides';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

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

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8 pt-24 max-w-3xl mx-auto">
            <Link href="/guides" className="inline-flex items-center text-zinc-500 hover:text-white mb-6 transition-colors">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Guides
            </Link>

            <article className="prose prose-invert prose-blue max-w-none">

                {/* Render Content */}
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {guide.content}
                </ReactMarkdown>

            </article>

            <div className="mt-12 pt-8 border-t border-zinc-800 text-sm text-zinc-500">
                <p>Status: {guide.status} • Category: {guide.category}</p>
            </div>
        </div>
    );
}
