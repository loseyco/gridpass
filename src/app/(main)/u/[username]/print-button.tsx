'use client';

import { Printer } from 'lucide-react';

export default function PrintButton() {
    return (
        <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black font-bold rounded hover:bg-neutral-200 transition-colors text-sm print:hidden"
        >
            <Printer className="w-4 h-4" />
            Print Resume
        </button>
    );
}
