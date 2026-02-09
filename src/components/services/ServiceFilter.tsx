'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';
import { Search } from 'lucide-react';

export function ServiceFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) {
                params.set(name, value);
            } else {
                params.delete(name);
            }
            return params.toString();
        },
        [searchParams]
    );

    const handleSearch = (term: string) => {
        startTransition(() => {
            router.push(`/services?${createQueryString('search', term)}`);
        });
    };

    const handleCategory = (category: string) => {
        startTransition(() => {
            router.push(`/services?${createQueryString('category', category)}`);
        });
    };

    return (
        <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                    <Search className="h-4 w-4" />
                </div>
                <input
                    type="text"
                    placeholder="Search services..."
                    defaultValue={searchParams.get('search')?.toString()}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-10 rounded-lg bg-neutral-900 border border-white/10 px-4 py-2 text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors"
                />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                {['All', 'Coaching', 'Engineering', 'Mechanic', 'Media', 'Logistics', 'Other'].map((cat) => {
                    const isActive = (cat === 'All' && !searchParams.get('category')) || searchParams.get('category') === cat;
                    return (
                        <button
                            key={cat}
                            onClick={() => handleCategory(cat === 'All' ? '' : cat)}
                            className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${isActive
                                    ? 'bg-purple-600 text-white border-purple-500'
                                    : 'bg-neutral-900 text-neutral-400 border-white/10 hover:text-white hover:bg-neutral-800'
                                }`}
                        >
                            {cat}
                        </button>
                    )
                })}
            </div>
        </div>
    );
}
