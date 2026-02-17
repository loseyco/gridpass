import { getAllGuides } from '@/lib/guides';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, FileText } from 'lucide-react';

export const metadata = {
    title: 'Guides & Tutorials - GridPass',
    description: 'Learn how to use GridPass features.',
};

export default function GuidesPage() {
    const guides = getAllGuides();

    // Group by category
    const categories: Record<string, typeof guides> = {};
    guides.forEach((guide) => {
        if (!categories[guide.category]) {
            categories[guide.category] = [];
        }
        categories[guide.category].push(guide);
    });

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8 pt-24 max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                    <BookOpen className="h-8 w-8 text-blue-500" />
                    Guides & Tutorials
                </h1>
                <p className="text-zinc-400">Documentation for the GridPass Operating System.</p>
            </div>

            <div className="space-y-8">
                {Object.entries(categories).map(([category, categoryGuides]) => (
                    <div key={category}>
                        <h2 className="text-xl font-bold mb-4 text-zinc-300 border-b border-zinc-800 pb-2">{category}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {categoryGuides.map((guide) => (
                                <Link key={guide.slug} href={`/guides/${guide.slug}`}>
                                    <Card className="h-full bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer group">
                                        <CardHeader className="p-4 pb-2">
                                            <div className="flex justify-between items-start mb-2">
                                                <FileText className="h-5 w-5 text-zinc-500 group-hover:text-blue-400 transition-colors" />
                                                <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 text-[10px] uppercase">
                                                    {guide.status}
                                                </Badge>
                                            </div>
                                            <CardTitle className="text-lg text-white group-hover:text-blue-400 transition-colors">{guide.title}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-0">
                                            <CardDescription className="text-zinc-500 line-clamp-2">
                                                {guide.description}
                                            </CardDescription>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}

                {guides.length === 0 && (
                    <div className="text-center py-12 text-zinc-500">
                        <p>No guides available properly yet. Check back soon!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
