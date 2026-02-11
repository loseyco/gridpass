'use client';

import { useState } from 'react';
import { Plus, Settings, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import CollectionSettingsModal from './CollectionSettingsModal';

interface CollectionActionsProps {
    collection: any;
}

export default function CollectionActions({ collection }: CollectionActionsProps) {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    return (
        <div className="flex items-center gap-3">
            <Link
                href={`/garage/add?collection_id=${collection.id}`}
                className="flex items-center gap-2 bg-white text-black hover:bg-neutral-200 px-5 py-2.5 rounded-lg font-bold transition-colors"
            >
                <Plus className="w-4 h-4" />
                Add Vehicle
            </Link>

            <button
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-5 py-2.5 rounded-lg font-bold transition-colors border border-neutral-700"
            >
                <Settings className="w-4 h-4" />
                Settings
            </button>

            <Link
                href={`/collections/${collection.id}/concierge`}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-bold transition-colors"
            >
                Concierge
            </Link>

            {isSettingsOpen && (
                <CollectionSettingsModal
                    collection={collection}
                    onClose={() => setIsSettingsOpen(false)}
                />
            )}
        </div>
    );
}
