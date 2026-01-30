
import { promises as fs } from 'fs';
import path from 'path';
import { Zap, Bug, Star, Clock } from 'lucide-react';

async function getChangelog() {
    try {
        const historyPath = path.join(process.cwd(), 'local-ai/reports/changelog_history.json');
        const data = await fs.readFile(historyPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

export const metadata = {
    title: 'Patch Notes | GridPass',
    description: 'Track the latest updates, features, and fixes for the GridPass platform.',
};

export default async function ChangelogPage() {
    const history = await getChangelog();

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-amber-500 selection:text-black">
            {/* Hero Section */}
            <div className="relative py-24 border-b border-neutral-900 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-neutral-950/0 to-neutral-950"></div>
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-500 text-xs font-mono uppercase tracking-widest mb-4">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        Live Transmission
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
                        Patch <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">Notes</span>
                    </h1>
                    <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
                        Track the evolution of GridPass. Features, fixes, and balance changes.
                    </p>
                </div>
            </div>

            {/* Timeline */}
            <div className="container mx-auto px-4 py-16 max-w-4xl">
                <div className="relative border-l border-neutral-800 ml-4 md:ml-0 space-y-16">
                    {history.map((entry: any, index: number) => (
                        <div key={index} className="relative pl-12 md:pl-0">
                            {/* Version Badge (Timeline Node) */}
                            <div className="absolute -left-[5px] top-0 md:left-auto md:right-full md:mr-8 w-3 h-3 bg-neutral-950 border-2 border-amber-500 rounded-full z-10 mt-2"></div>

                            {/* Version & Date (Desktop Side Label) */}
                            <div className="hidden md:block absolute right-full mr-16 top-0 text-right w-32">
                                <div className="text-2xl font-mono font-bold text-amber-500">{entry.version}</div>
                                <div className="text-neutral-500 text-sm flex items-center justify-end gap-1">
                                    <Clock className="w-3 h-3" />
                                    {entry.date}
                                </div>
                            </div>

                            {/* Mobile Header (Visible only on small screens) */}
                            <div className="md:hidden mb-2">
                                <span className="text-xl font-mono font-bold text-amber-500 mr-2">{entry.version}</span>
                                <span className="text-neutral-500 text-sm">{entry.date}</span>
                            </div>

                            {/* Content Card */}
                            <div className="group">
                                <h2 className="text-3xl font-bold mb-2 group-hover:text-amber-500 transition-colors">
                                    {entry.title}
                                </h2>
                                <p className="text-neutral-400 text-lg mb-6 leading-relaxed">
                                    {entry.summary}
                                </p>

                                <div className="grid gap-3">
                                    {entry.changes.map((change: any, cIdx: number) => {
                                        let Icon = Star;
                                        let colorClass = "text-neutral-400";
                                        let bgClass = "bg-neutral-900";

                                        if (change.type === 'feature') {
                                            Icon = Zap;
                                            colorClass = "text-emerald-400";
                                            bgClass = "bg-emerald-500/5 border-emerald-500/20";
                                        } else if (change.type === 'fix') {
                                            Icon = Bug;
                                            colorClass = "text-red-400";
                                            bgClass = "bg-red-500/5 border-red-500/20";
                                        } else if (change.type === 'improvement') {
                                            Icon = Star;
                                            colorClass = "text-blue-400";
                                            bgClass = "bg-blue-500/5 border-blue-500/20";
                                        }

                                        return (
                                            <div key={cIdx} className={`p-4 rounded-lg border ${bgClass || 'border-neutral-800'} flex items-start gap-4 transition-all hover:scale-[1.01]`}>
                                                <div className={`mt-1 ${colorClass}`}>
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                                <div className="text-neutral-300">
                                                    <span className={`text-xs font-bold uppercase tracking-wider mb-1 block ${colorClass}`}>
                                                        {change.type}
                                                    </span>
                                                    <div dangerouslySetInnerHTML={{ __html: change.text }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
