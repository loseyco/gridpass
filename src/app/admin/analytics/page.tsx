import { getDailyTraffic, getUserGrowth, getTopReferrers } from '@/app/actions/reports';
import TrafficChart from '@/components/admin/analytics/TrafficChart';
import RealtimeTicker from '@/components/admin/analytics/RealtimeTicker';
import GrowthChart from '@/components/admin/analytics/GrowthChart';
import ReportHeader from '@/components/admin/analytics/ReportHeader';
import PrintButton from '@/components/admin/analytics/PrintButton';
import { BarChart, Users, Globe } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
    // Fetch data in parallel
    const [traffic, growth, referrers] = await Promise.all([
        getDailyTraffic(30),
        getUserGrowth(30),
        getTopReferrers()
    ]);

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans p-8 print:bg-white print:text-black">
            <ReportHeader />

            <div className="print:hidden flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <BarChart className="w-8 h-8 text-indigo-500" />
                    <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
                </div>
                <PrintButton />
            </div>

            {/* Print Only Title */}
            <div className="hidden print:block mb-8">
                <h2 className="text-xl font-bold text-black mb-2">Platform Performance Report</h2>
                <p className="text-sm text-gray-600">30-Day Growth & Traffic Analysis</p>
            </div>

            {/* Live Activity Feed */}
            <RealtimeTicker />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Traffic */}
                <div className="bg-neutral-900 border border-white/5 rounded-xl p-6 print:border-gray-200 print:bg-white print:break-inside-avoid">
                    <h3 className="text-lg font-bold mb-1 flex items-center gap-2 print:text-black">
                        <Globe className="w-4 h-4 text-indigo-400 print:text-black" />
                        Traffic Overview
                    </h3>
                    <p className="text-sm text-neutral-500 mb-6 print:text-gray-500">Daily page views (30 Days)</p>
                    <TrafficChart data={traffic} />
                </div>

                {/* User Growth */}
                <div className="bg-neutral-900 border border-white/5 rounded-xl p-6 print:border-gray-200 print:bg-white print:break-inside-avoid">
                    <h3 className="text-lg font-bold mb-1 flex items-center gap-2 print:text-black">
                        <Users className="w-4 h-4 text-emerald-400 print:text-black" />
                        User Growth
                    </h3>
                    <p className="text-sm text-neutral-500 mb-6 print:text-gray-500">New signups (30 Days)</p>
                    <GrowthChart data={growth} />
                </div>
            </div>

            {/* Top Sources */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-neutral-900 border border-white/5 rounded-xl p-6 print:border-gray-200 print:bg-white print:break-inside-avoid">
                    <h3 className="text-lg font-bold mb-4 print:text-black">Top Traffic Sources</h3>
                    <div className="space-y-3">
                        {referrers.map((ref, i) => (
                            <div key={ref.name} className="flex justify-between items-center text-sm">
                                <span className="text-neutral-400 print:text-black">
                                    {i + 1}. {ref.name}
                                </span>
                                <span className="font-mono font-bold print:text-black">{ref.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Disclaimer Footer */}
            <div className="mt-12 pt-8 border-t border-white/5 text-center text-xs text-neutral-600 print:text-gray-400 print:border-t print:border-gray-200">
                <p>CONFIDENTIAL: This report contains proprietary data from GridPass.</p>
                <p>Generated via Admin Console.</p>
            </div>
        </div>
    );
}
