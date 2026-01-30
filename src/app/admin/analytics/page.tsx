
import { promises as fs } from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';

async function getSeoReport() {
    try {
        const reportPath = path.join(process.cwd(), 'local-ai/reports/seo_audit.json');
        const data = await fs.readFile(reportPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Failed to load SEO report:", error);
        return null;
    }
}

export default async function AdminAnalyticsPage() {
    const report = await getSeoReport();

    return (
        <div className="p-8 space-y-8 bg-neutral-950 min-h-screen text-white">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                        SEO Command Center
                    </h1>
                    <p className="text-neutral-400">Real-time optimization intelligence.</p>
                </div>
                <div className="flex gap-4">
                    <span className="px-3 py-1 bg-neutral-900 border border-neutral-800 rounded text-xs font-mono text-neutral-500 flex items-center">
                        AGENT STATUS: ONLINE
                    </span>
                </div>
            </div>

            <AnalyticsDashboard initialReport={report} />
        </div>
    );
}
