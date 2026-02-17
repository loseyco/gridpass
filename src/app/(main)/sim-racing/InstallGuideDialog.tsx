'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Terminal, CheckCircle2, X } from 'lucide-react';

export function InstallGuideDialog({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <div onClick={() => setIsOpen(true)}>
                {children}
            </div>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-neutral-900 border border-neutral-800 text-white rounded-lg shadow-xl w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                        >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Close</span>
                        </button>

                        <div className="flex flex-col space-y-1.5 p-6 text-center sm:text-left">
                            <h2 className="text-lg font-semibold leading-none tracking-tight">Install GridPass Client</h2>
                            <p className="text-sm text-neutral-400">
                                Follow these steps to connect your simulator.
                            </p>
                        </div>

                        <div className="space-y-6 p-6 pt-0">
                            {/* Step 1 */}
                            <div className="flex gap-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-900/50 text-blue-400 border border-blue-800 font-bold">
                                    <Download className="h-5 w-5" />
                                </div>
                                <div className="space-y-1 flex-1">
                                    <h4 className="text-sm font-medium leading-none text-white">1. Download Client</h4>
                                    <p className="text-sm text-neutral-400">
                                        Get the native GridPass app for your Sim PC.
                                    </p>
                                    <a href="/client.zip" download="GridPass.zip">
                                        <Button className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white">
                                            <Download className="mr-2 h-4 w-4" /> Download App (.zip)
                                        </Button>
                                    </a>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="flex gap-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-900/50 text-yellow-500 border border-yellow-800 font-bold">
                                    <Terminal className="h-5 w-5" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-medium leading-none text-white">2. Run GridPass</h4>
                                    <p className="text-sm text-neutral-400">
                                        Extract the zip. Double-click
                                        <code className="bg-neutral-800 px-1 py-0.5 rounded mx-1 text-white border border-neutral-700">GridPass.exe</code>.
                                    </p>
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="flex gap-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-900/50 text-green-500 border border-green-800 font-bold">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-medium leading-none text-white">3. Connected!</h4>
                                    <p className="text-sm text-neutral-400">
                                        The terminal will say "Client Ready". This dashboard will update automatically.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
