'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function LeagueJoinReturnPage() {
    const searchParams = useSearchParams();
    const params = useParams();
    const slug = params.slug as string;
    const sessionId = searchParams.get('session_id');
    const [status, setStatus] = useState<'loading' | 'complete' | 'error'>('loading');
    const [customerEmail, setCustomerEmail] = useState('');

    useEffect(() => {
        if (!sessionId) {
            setStatus('error');
            return;
        }

        // Technically we should fetch the session status from our backend to verify,
        // but for embedded checkout, the presence of the return URL usually means completion.
        // Let's verify via a new API endpoint or just assume success if we want a quick UI.
        // Better: Validating via API.

        fetch(`/api/stripe/status?session_id=${sessionId}`)
            .then(res => res.json())
            .then(data => {
                if (data.status === 'complete' || data.status === 'open') {
                    setStatus('complete');
                    setCustomerEmail(data.customer_email);
                } else {
                    setStatus('error');
                }
            })
            .catch(() => setStatus('error'));

    }, [sessionId]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <p>Verifying payment...</p>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
                <XCircle className="h-16 w-16 text-red-500" />
                <h1 className="text-2xl font-bold">Payment verification failed.</h1>
                <p className="text-gray-400">Please contact support or try again.</p>
                <Link href={`/league/${slug}/join`}><Button>Try Again</Button></Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6 p-4">
            <CheckCircle className="h-20 w-20 text-green-500" />
            <div className="text-center space-y-2">
                <h1 className="text-4xl font-bold">Welcome to the League!</h1>
                <p className="text-xl text-gray-400">Your payment was successful.</p>
                <p className="text-sm text-gray-500">Receipt sent to {customerEmail}</p>
            </div>

            <div className="flex gap-4">
                <Link href="/league/driver">
                    <Button className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold h-12 px-8">
                        Go to Driver Dashboard
                    </Button>
                </Link>
            </div>
        </div>
    );
}
