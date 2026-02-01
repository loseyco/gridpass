"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
    Calculator,
    User,
    CreditCard,
    Settings,
    Calendar,
    Smile,
    Wrench,
    Search,
    Trophy,
    LayoutDashboard
} from "lucide-react";

export function PitLane() {
    const [open, setOpen] = React.useState(false);
    const router = useRouter();

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[20vh]">
            <div className="w-full max-w-2xl px-4 animate-in fade-in zoom-in-95 duration-200">
                <Command className="bg-neutral-900 border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
                    <div className="flex items-center border-b border-white/5 px-4" cmdk-input-wrapper="">
                        <Search className="w-5 h-5 text-neutral-500 mr-2" />
                        <Command.Input
                            placeholder="Type a command or search..."
                            className="w-full bg-transparent py-4 text-lg text-white placeholder:text-neutral-500 focus:outline-none"
                        />
                    </div>

                    <Command.List className="max-h-[60vh] overflow-y-auto p-2 scroll-py-2">
                        <Command.Empty className="py-6 text-center text-neutral-500 text-sm">
                            No results found.
                        </Command.Empty>

                        <Command.Group heading="Navigation" className="text-xs font-bold text-neutral-500 uppercase tracking-widest px-2 mb-2 mt-2">
                            <Command.Item
                                onSelect={() => runCommand(() => router.push("/dashboard"))}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-300 hover:bg-indigo-600 hover:text-white cursor-pointer transition-colors aria-selected:bg-indigo-600 aria-selected:text-white"
                            >
                                <LayoutDashboard className="w-4 h-4" />
                                <span>Dashboard</span>
                            </Command.Item>
                            <Command.Item
                                onSelect={() => runCommand(() => router.push("/dashboard/profile"))}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-300 hover:bg-indigo-600 hover:text-white cursor-pointer transition-colors aria-selected:bg-indigo-600 aria-selected:text-white"
                            >
                                <User className="w-4 h-4" />
                                <span>My Profile</span>
                            </Command.Item>
                            <Command.Item
                                onSelect={() => runCommand(() => router.push("/shop"))}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-300 hover:bg-indigo-600 hover:text-white cursor-pointer transition-colors aria-selected:bg-indigo-600 aria-selected:text-white"
                            >
                                <Wrench className="w-4 h-4" />
                                <span>Find a Shop</span>
                            </Command.Item>
                        </Command.Group>

                        <Command.Group heading="Tools" className="text-xs font-bold text-neutral-500 uppercase tracking-widest px-2 mb-2 mt-4">
                            <Command.Item className="flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-300 hover:bg-indigo-600 hover:text-white cursor-pointer transition-colors aria-selected:bg-indigo-600 aria-selected:text-white">
                                <Calculator className="w-4 h-4" />
                                <span>Quick Calc</span>
                            </Command.Item>
                            <Command.Item className="flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-300 hover:bg-indigo-600 hover:text-white cursor-pointer transition-colors aria-selected:bg-indigo-600 aria-selected:text-white">
                                <Trophy className="w-4 h-4" />
                                <span>Race Results</span>
                            </Command.Item>
                        </Command.Group>

                        <Command.Group heading="Settings" className="text-xs font-bold text-neutral-500 uppercase tracking-widest px-2 mb-2 mt-4">
                            <Command.Item
                                onSelect={() => runCommand(() => router.push("/dashboard/settings"))}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-300 hover:bg-indigo-600 hover:text-white cursor-pointer transition-colors aria-selected:bg-indigo-600 aria-selected:text-white"
                            >
                                <Settings className="w-4 h-4" />
                                <span>Platform Settings</span>
                            </Command.Item>
                        </Command.Group>
                    </Command.List>

                    <div className="border-t border-white/5 p-2 bg-neutral-950/50 flex justify-end">
                        <div className="text-[10px] text-neutral-600 font-mono">
                            <span className="bg-white/10 px-1 py-0.5 rounded text-neutral-400">ESC</span> to close
                        </div>
                    </div>
                </Command>
            </div>
        </div>
    );
}
