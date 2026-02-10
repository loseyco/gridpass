'use client';

import { useState } from 'react';
import LeadRow from './LeadRow';
import { X, Copy, Check } from 'lucide-react';

export default function LeadsManager({ initialLeads }: { initialLeads: any[] }) {
    const [selectedLead, setSelectedLead] = useState<any>(null);
    const [copied, setCopied] = useState(false);

    // Filter out archived unless empty
    const activeLeads = initialLeads.filter(l => l.status !== 'archived');

    // Scripts based on outreach.md strategies
    const scripts = {
        'Client (Shop)': {
            title: 'The "Shop Drop-In" / Direct Pitch',
            body: `Hi, I'm PJ. I'm a local racing engineer and data strategist here in [Location].\n\nI offer a 'white glove' transport and track support service—I can drive your customer's rig to the track, set up their pit, and handle the data engineering so your techs can stay in the shop.\n\nHere's my profile: gridpass.app/u/pjlosey`
        },
        'Client (Club)': {
            title: 'The "Arrive & Drive" Pitch',
            body: `Focus on the driving, not the hauling.\n\nI provide professional logistics support for [Club Name] members. I'll transport your vehicle using your equipment, handle tech inspection, and have your car ready in the pit lane when you arrive.\n\nCheck my racing resume: gridpass.app/u/pjlosey`
        },
        'default': {
            title: 'General Racing Network',
            body: `Hey [Name], I’m a local racing engineer based in Grayslake (ex-IndyCar/Honda). I noticed you guys run at Blackhawk/Autobahn.\n\nIf you ever need a solid driver to haul your rig to the track or help with paddock logistics/data engineering, I’m available. I have a clean Class D/M license and professional experience.\n\nMy resume is here: gridpass.app/u/pjlosey`
        }
    };

    const getScript = (lead: any) => {
        const type = lead.role; // 'Client (Shop)', etc.
        let template = scripts[type as keyof typeof scripts] || scripts.default;

        let body = template.body
            .replace('[Location]', lead.contact_info?.location || 'the area')
            .replace('[Club Name]', lead.name)
            .replace('[Name]', lead.name);

        return { title: template.title, body };
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative">
            <div className="bg-neutral-900/50 border border-white/5 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-neutral-400">
                        <thead className="bg-neutral-800/50 text-neutral-200 uppercase font-bold text-xs">
                            <tr>
                                <th className="px-6 py-4">Name / Target</th>
                                <th className="px-6 py-4">Opportunity</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {activeLeads.map((lead) => (
                                <LeadRow key={lead.id} lead={lead} onShowScript={setSelectedLead} />
                            ))}
                            {activeLeads.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-neutral-500">
                                        No active leads. Good job!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Script Modal */}
            {selectedLead && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-neutral-900 border border-white/10 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-neutral-800/50">
                            <div>
                                <h3 className="text-lg font-bold text-white">Outreach Script</h3>
                                <p className="text-xs text-neutral-400">Target: {selectedLead.name}</p>
                            </div>
                            <button onClick={() => setSelectedLead(null)} className="p-1 hover:bg-white/10 rounded-full text-neutral-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-neutral-500 uppercase">Strategy</label>
                                <p className="text-sm text-indigo-300 font-medium">
                                    {getScript(selectedLead).title}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-neutral-500 uppercase">Message Body</label>
                                    <button
                                        onClick={() => handleCopy(getScript(selectedLead).body)}
                                        className="text-xs flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
                                    >
                                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                        {copied ? 'Copied' : 'Copy to Clipboard'}
                                    </button>
                                </div>
                                <div className="p-4 bg-black/50 rounded-lg border border-white/5 text-neutral-300 text-sm whitespace-pre-wrap font-mono">
                                    {getScript(selectedLead).body}
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    onClick={() => setSelectedLead(null)}
                                    className="px-4 py-2 text-sm text-neutral-400 hover:text-white"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => {
                                        // Ideally check 'Contacted' here
                                        handleCopy(getScript(selectedLead).body);
                                        // We could trigger status update here too if we passed the handler
                                    }}
                                    className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg flex items-center gap-2"
                                >
                                    <Copy className="w-4 h-4" />
                                    Copy Script
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
