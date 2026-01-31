import { getRecommendations } from '@/app/actions/recommendations';
import { Star, MessageSquareQuote, ShieldCheck } from 'lucide-react';
import WriteRecommendation from './WriteRecommendation';
import Link from 'next/link';

export default async function RecommendationSection({ targetUserId, targetName }: { targetUserId: string, targetName: string }) {
    const recommendations = await getRecommendations(targetUserId);

    return (
        <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6 md:p-8 mb-6 animate-fade-in break-inside-avoid print:bg-white print:border-none print:p-0 print:mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-4 border-b border-white/5 print:border-gray-300 print:mb-3 print:pb-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-neutral-800 rounded-lg print:hidden">
                        <Star className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold print:text-black print:uppercase print:tracking-widest print:text-sm">
                            Recommendations
                        </h3>
                        {recommendations.length > 0 && (
                            <p className="text-sm text-neutral-500 print:text-xs">
                                Verified reviews from the grid.
                            </p>
                        )}
                    </div>
                </div>

                <div className="print:hidden">
                    <WriteRecommendation targetUserId={targetUserId} targetName={targetName} />
                </div>
            </div>

            {recommendations.length === 0 ? (
                <div className="text-center py-8 bg-white/5 rounded-xl border border-dashed border-white/10 print:hidden">
                    <MessageSquareQuote className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                    <p className="text-neutral-400 text-sm mb-4">No specific recommendations yet.</p>
                    {/* <div className="text-xs text-neutral-600">Be the first to vouch for {targetName}!</div> */}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-1">
                    {recommendations.map(rec => (
                        <div key={rec.id} className="relative bg-black/20 border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors print:border print:border-gray-200">
                            {/* Quote Icon Background */}
                            <div className="absolute top-4 right-4 text-white/5 print:hidden">
                                <MessageSquareQuote className="w-8 h-8" />
                            </div>

                            <div className="flex items-start gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-neutral-800 border border-white/5 overflow-hidden flex items-center justify-center shrink-0">
                                    {rec.author?.avatar_url ? (
                                        <img src={rec.author.avatar_url} alt={rec.author_name || 'Author'} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xs font-bold text-neutral-500">
                                            {(rec.author?.full_name || rec.author_name || 'U').charAt(0)}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <div className="font-bold text-white text-sm print:text-black">
                                        {rec.author ? (
                                            <Link href={`/u/${rec.author.username}`} className="hover:underline decoration-neutral-500">
                                                {rec.author.full_name || rec.author.username}
                                            </Link>
                                        ) : (
                                            <span>{rec.author_name || 'Verified User'}</span>
                                        )}
                                    </div>
                                    <div className="text-xs text-neutral-500 flex items-center gap-1.5 print:text-gray-600">
                                        <span>{rec.relationship}</span>
                                        {rec.author && <ShieldCheck className="w-3 h-3 text-indigo-400" title="Verified GridPass Member" />}
                                    </div>
                                </div>
                            </div>

                            <p className="text-neutral-300 text-sm leading-relaxed mb-3 print:text-black print:text-xs">
                                "{rec.content}"
                            </p>

                            <div className="text-[10px] text-neutral-600 print:text-gray-400">
                                {new Date(rec.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
