'use client';

import { Button } from '@/components/ui/button';
import { Bell, BellOff } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

export default function StewardsHeader() {
    const { isSupported, subscription, subscribe, unsubscribe, loading } = usePushNotifications();

    const handleToggle = async () => {
        if (subscription) {
            await unsubscribe();
        } else {
            await subscribe();
        }
    };

    if (!isSupported) return null;

    return (
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-black italic tracking-tighter text-white">
                    SIM <span className="text-red-500">STEWARDS</span>
                </h1>
                <p className="text-zinc-400">Who's at fault? You decide.</p>
            </div>
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggle}
                    disabled={loading}
                    className={subscription ? "text-green-500 hover:text-green-400" : "text-zinc-400 hover:text-white"}
                >
                    {loading ? (
                        <span className="animate-pulse">Loading...</span>
                    ) : subscription ? (
                        <><Bell className="w-4 h-4 mr-2" /> Alerts On</>
                    ) : (
                        <><BellOff className="w-4 h-4 mr-2" /> Enable Alerts</>
                    )}
                </Button>

                <Link href="/sim-racing/stewards/submit">
                    <Button className="bg-red-600 hover:bg-red-700 text-white">
                        <PlusCircle className="w-4 h-4 mr-2" /> Submit Incident
                    </Button>
                </Link>
            </div>
        </div>
    );
}
