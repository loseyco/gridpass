import { MonitorSmartphone, RefreshCw } from "lucide-react";
import { useState } from "react";

interface PairingScreenProps {
    code?: string;
    onReset: () => void;
}

export default function PairingScreen({ code }: PairingScreenProps) {
    const [copyStatus, setCopyStatus] = useState("Copy");

    const handleCopy = () => {
        if (code) {
            navigator.clipboard.writeText(code);
            setCopyStatus("Copied!");
            setTimeout(() => setCopyStatus("Copy"), 2000);
        }
    }

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-8">
            <div className="mb-8 p-4 bg-indigo-500/10 rounded-full animate-pulse border border-indigo-500/30">
                <MonitorSmartphone className="w-16 h-16 text-indigo-500" />
            </div>

            <h1 className="text-3xl font-bold mb-2 tracking-tight">GridPass Desktop</h1>
            <p className="text-neutral-400 mb-10 text-center max-w-sm">
                Enter this code on your GridPass Command Center to pair this device.
            </p>

            {code ? (
                <div className="flex flex-col items-center gap-4">
                    <div
                        className="bg-neutral-900 border border-neutral-800 rounded-2xl px-12 py-8 text-7xl font-mono tracking-[0.2em] select-all cursor-pointer hover:border-indigo-500 transition-colors shadow-2xl shadow-indigo-500/10"
                        onClick={handleCopy}
                    >
                        {code}
                    </div>
                    <p className="text-xs text-neutral-600 uppercase font-bold tracking-widest">{copyStatus}</p>
                </div>
            ) : (
                <div className="flex items-center gap-3 text-neutral-500">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Generating Code...</span>
                </div>
            )}

            <div className="mt-12 text-xs text-neutral-700 font-mono">
                v{window.api ? '2.0.0' : 'Unknown'}
            </div>
        </div>
    );
}
