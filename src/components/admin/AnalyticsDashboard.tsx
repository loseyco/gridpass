
'use client';

import { useState } from 'react';
import { BarChart3, CheckCircle, AlertTriangle, FileText, Search, RefreshCw } from 'lucide-react';

interface SeoDetail {
    file: string;
    status: 'generated' | 'skipped' | 'error';
    preview?: string;
    error?: string;
}

interface SeoReport {
    generatedAt: string;
    pagesScanned: number;
    missingMetadata: number;
    details: SeoDetail[];
}

export default function AnalyticsDashboard({ initialReport }: { initialReport: SeoReport | null }) {
    const [report, setReport] = useState<SeoReport | null>(initialReport);
    const [isScanning, setIsScanning] = useState(false);

    if (!report) {
        return (
            <div className="p-12 border border-neutral-800 rounded-xl bg-neutral-900 text-center">
                <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold">No SEO Report Found</h3>
                <p className="text-neutral-400 mb-6">The Local SEO Agent hasn't generated an audit yet.</p>
                <button disabled className="px-4 py-2 bg-neutral-800 text-neutral-500 rounded cursor-not-allowed">
                    Waiting for Agent...
                </button>
            </div>
        );
    }

    const healthScore = Math.round(((report.pagesScanned - report.missingMetadata) / report.pagesScanned) * 100) || 0;

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card
                    label="Health Score"
                    value={`${healthScore}%`}
                    icon={<BarChart3 className="text-emerald-500" />}
                    trend={healthScore === 100 ? "Perfect" : "Needs Optimization"}
                />
                <Card
                    label="Pages Scanned"
                    value={report.pagesScanned}
                    icon={<FileText className="text-blue-500" />}
                />
                <Card
                    label="Optimized Recently"
                    value={report.missingMetadata}
                    icon={<CheckCircle className="text-amber-500" />}
                    subtext="Metadata Generated"
                />
                <Card
                    label="Last Scan"
                    value={new Date(report.generatedAt).toLocaleTimeString()}
                    icon={<RefreshCw className="text-purple-500" />}
                    subtext={new Date(report.generatedAt).toLocaleDateString()}
                />
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Visuals (Mocked for now) */}
                <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Search className="w-5 h-5 text-neutral-400" />
                        Search Visibility Trend
                    </h3>
                    <div className="h-64 flex items-end justify-between gap-2 px-4">
                        {[40, 65, 55, 80, 75, 90, 85].map((h, i) => (
                            <div key={i} className="w-full bg-neutral-800 hover:bg-amber-500/50 transition-all rounded-t relative group" style={{ height: `${h}%` }}>
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-950 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-neutral-700">
                                    {h}% Optimization
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Activity Log */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 flex flex-col">
                    <h3 className="text-lg font-bold mb-4">Recent Agent Actions</h3>
                    <div className="flex-1 overflow-y-auto max-h-[400px] space-y-3 pr-2 scrollbar-thin scrollbar-thumb-neutral-700">
                        {report.details.map((detail, idx) => (
                            <div key={idx} className="p-3 bg-neutral-950/50 border border-neutral-800 rounded-lg text-sm group hover:border-neutral-700 transition-colors">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-mono text-amber-500 truncate max-w-[180px]" title={detail.file}>
                                        {detail.file}
                                    </span>
                                    <StatusBadge status={detail.status} />
                                </div>
                                {detail.preview && (
                                    <div className="text-neutral-500 text-xs line-clamp-2 font-mono bg-neutral-950 p-2 rounded mt-2 border border-neutral-900 group-hover:border-neutral-800">
                                        {detail.preview}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Card({ label, value, icon, subtext, trend }: any) {
    return (
        <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl flex flex-col justify-between hover:border-neutral-700 transition-colors group">
            <div className="flex justify-between items-start mb-2">
                <span className="text-neutral-400 text-sm font-medium">{label}</span>
                <div className="p-2 bg-neutral-950 rounded-lg group-hover:scale-110 transition-transform">
                    {icon}
                </div>
            </div>
            <div>
                <div className="text-3xl font-bold text-white mb-1">{value}</div>
                {(subtext || trend) && (
                    <div className="text-xs text-neutral-500 flex items-center gap-1">
                        {trend && <span className="text-emerald-500 font-medium">{trend}</span>}
                        {subtext}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        generated: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        skipped: 'bg-neutral-800 text-neutral-400 border-neutral-700',
        error: 'bg-red-500/10 text-red-500 border-red-500/20',
    };

    // @ts-ignore
    const style = styles[status] || styles.skipped;

    return (
        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${style}`}>
            {status}
        </span>
    )
}
