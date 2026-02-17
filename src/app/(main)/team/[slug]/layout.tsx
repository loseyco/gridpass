import { ReactNode } from 'react';

export default function TeamLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex flex-col min-h-screen">
            <main className="flex-1 w-full">
                {children}
            </main>
        </div>
    );
}
