import { createClient } from '@/utils/supabase/server';
import { getAffiliateStatus, createAffiliateAccount, getLoginLink } from '@/app/actions/affiliate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DollarSign, Users, MousePointer, Link as LinkIcon, ExternalLink, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import Script from 'next/script'; // Not used but good practice if we needed client bits

export default async function AffiliateDashboardPage({
    searchParams,
}: {
    searchParams?: { [key: string]: string | string[] | undefined };
}) {
    const affiliate = await getAffiliateStatus();
    const setupComplete = searchParams?.setup === 'complete';

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-white tracking-tight">Affiliate Program</h1>
                <p className="text-neutral-400">Earn commissions by referring new teams and drivers to GridPass.</p>
            </div>

            {setupComplete && (
                <Alert className="bg-emerald-500/10 border-emerald-500/20 text-emerald-500">
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Success!</AlertTitle>
                    <AlertDescription>Your payouts account has been connected.</AlertDescription>
                </Alert>
            )}

            {!affiliate ? (
                <Card className="bg-neutral-900 border-white/5">
                    <CardHeader>
                        <CardTitle className="text-white">Join the Program</CardTitle>
                        <CardDescription>Partner with us and earn revenue share on every subscription you refer.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-3 gap-4 mb-4">
                            <div className="p-4 bg-white/5 rounded-lg">
                                <h3 className="text-lg font-bold text-white mb-1">Simple Links</h3>
                                <p className="text-sm text-neutral-400">Share your unique link anywhere. We track the rest.</p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-lg">
                                <h3 className="text-lg font-bold text-white mb-1">Real-time Stats</h3>
                                <p className="text-sm text-neutral-400">See clicks and signups as they happen.</p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-lg">
                                <h3 className="text-lg font-bold text-white mb-1">Weekly Payouts</h3>
                                <p className="text-sm text-neutral-400">Get paid directly to your bank account via Stripe.</p>
                            </div>
                        </div>

                        <form action={async () => {
                            'use server';
                            const result = await createAffiliateAccount();
                            if (result?.url) import('next/navigation').then(({ redirect }) => redirect(result.url));
                        }}>
                            <Button size="lg" className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 font-bold">
                                Get Started
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="bg-neutral-900 border-white/5">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-neutral-400">Total Earnings</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-white">${affiliate.stats?.earnings?.toFixed(2) || '0.00'}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-neutral-900 border-white/5">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-neutral-400">Pending Payout</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-amber-500">${affiliate.stats?.pending_commission?.toFixed(2) || '0.00'}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-neutral-900 border-white/5">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-neutral-400">Signups</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 text-2xl font-bold text-white">
                                    <Users className="w-5 h-5 text-indigo-500" />
                                    {affiliate.stats?.signups || 0}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-neutral-900 border-white/5">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-neutral-400">Clicks</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 text-2xl font-bold text-white">
                                    <MousePointer className="w-5 h-5 text-neutral-500" />
                                    {affiliate.stats?.clicks || 0}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content Area */}
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Left Column: Link & Settings */}
                        <div className="md:col-span-2 space-y-6">
                            <Card className="bg-neutral-900 border-white/5">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <LinkIcon className="w-5 h-5 text-indigo-500" />
                                        Your Referral Link
                                    </CardTitle>
                                    <CardDescription>Share this link to earn credit.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex gap-2">
                                        <code className="flex-1 p-3 bg-black/50 border border-white/10 rounded-lg text-neutral-300 font-mono text-sm">
                                            {`${process.env.NEXT_PUBLIC_BASE_URL || 'https://gridpass.app'}/?ref=${affiliate.referral_code}`}
                                        </code>
                                        <Button variant="outline" className="shrink-0">
                                            Copy
                                        </Button>
                                    </div>
                                    <div className="text-sm text-neutral-500">
                                        <p>• 10% commission on all referred transactions</p>
                                        <p>• 30-day cookie period</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column: Stripe Status */}
                        <div className="space-y-6">
                            <Card className="bg-neutral-900 border-white/5">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <DollarSign className="w-5 h-5 text-emerald-500" />
                                        Payout Settings
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                                        <span className="text-sm text-neutral-300">Stripe Status</span>
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase
                                        ${affiliate.stripe_status === 'active' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'}
                                    `}>
                                            {affiliate.stripe_status}
                                        </span>
                                    </div>

                                    <form action={async () => {
                                        'use server';
                                        if (affiliate.stripe_account_id) {
                                            const result = await getLoginLink(affiliate.stripe_account_id);
                                            if (result?.url) import('next/navigation').then(({ redirect }) => redirect(result.url));
                                        }
                                    }}>
                                        <Button variant="outline" className="w-full justify-between group">
                                            Manage Payouts
                                            <ExternalLink className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
