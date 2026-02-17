'use client';

import { convertToJob, convertToClassified, discardListing } from './actions';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button'; // Assuming button component exists
import { Loader2 } from 'lucide-react';

export default function ListingActions({ listing }: { listing: any }) {
    const [isPending, startTransition] = useTransition();

    const handleJob = () => {
        startTransition(async () => {
            await convertToJob(listing.id);
        });
    };

    const handleClassified = () => {
        startTransition(async () => {
            await convertToClassified(listing.id);
        });
    };

    const handleDiscard = () => {
        startTransition(async () => {
            await discardListing(listing.id);
        });
    };

    return (
        <div className="flex gap-2">
            {listing.type === 'job' && (
                <Button onClick={handleJob} disabled={isPending} size="sm">
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Job'}
                </Button>
            )}

            {listing.type === 'classified' && (
                <Button onClick={handleClassified} disabled={isPending} size="sm">
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'List Item'}
                </Button>
            )}

            <Button onClick={handleDiscard} variant="ghost" disabled={isPending} size="sm" className="text-red-500 hover:text-red-400">
                Discard
            </Button>
        </div>
    );
}
