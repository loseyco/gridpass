'use client';

import { useState } from 'react';
import { updateLeadStatus } from './actions';
import { MessageSquare, ExternalLink, ChevronDown, Check, Clock, X } from 'lucide-react';

interface Lead {
    id: string;
    name: string;
    role: string | null;
    primary_skill: string | null;
    source_link: string | null;
    status: string;
    contact_info: any;
}

export default function LeadRow({ lead, onShowScript }: { lead: Lead, onShowScript: (lead: Lead) => void }) {
    const [status, setStatus] = useState(lead.status);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleStatusChange = async (newStatus: string) => {
        setIsUpdating(true);
        try {
            await updateLeadStatus(lead.id, newStatus);
            setStatus(newStatus);
            setIsDropdownOpen(false);
        } catch (error) {
            console.error('Failed to update status', error);
        } finally {
            setIsUpdating(false);
        }
    };

    const statusColors = {
        new: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        contacted: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        claimed: 'bg-green-500/10 text-green-400 border-green-500/20',
        archived: 'bg-neutral-800 text-neutral-500 border-neutral-700',
    };

    function StarIcon(props: any) {
        return (
            <svg
                {...props}
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
        )
    }

    return (
        <tr className="hover:bg-white/5 transition-colors group">
            <td className="px-6 py-4">
                <div className="flex flex-col">
                    <span className="font-bold text-white text-base">{lead.name}</span>
                    <span className="text-xs text-neutral-400">{lead.primary_skill || 'General'}</span>
                    {lead.contact_info?.location && (
                        <span className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
                            📍 {lead.contact_info.location}
                        </span>
                    )}
                </div>
            </td>
            <td className="px-6 py-4 text-sm text-neutral-300">
                <div className="flex flex-col gap-1">
                    <span>{lead.role || 'N/A'}</span>
                    {/* Display notes if available in contact_info */}
                    {lead.contact_info?.notes && (
                        <span className="text-xs text-indigo-300 italic">"{lead.contact_info.notes}"</span>
                    )}
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="relative">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        disabled={isUpdating}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 transition-all ${statusColors[status as keyof typeof statusColors] || statusColors.new} ${isUpdating ? 'opacity-50' : 'hover:brightness-110'}`}
                    >
                        {status === 'new' && <StarIcon className="w-3 h-3" />}
                        {status === 'contacted' && <Clock className="w-3 h-3" />}
                        {status === 'claimed' && <Check className="w-3 h-3" />}
                        {status.toUpperCase()}
                        <ChevronDown className={`w-3 h-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Status Dropdown */}
                    {isDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 w-40 bg-neutral-900 border border-white/10 rounded-lg shadow-xl overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-100">
                            {['new', 'contacted', 'claimed', 'archived'].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => handleStatusChange(s)}
                                    className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-white/5 flex items-center gap-2 ${status === s ? 'text-white bg-white/5' : 'text-neutral-400'}`}
                                >
                                    <span className={`w-2 h-2 rounded-full ${s === 'new' ? 'bg-blue-500' :
                                            s === 'contacted' ? 'bg-yellow-500' :
                                                s === 'claimed' ? 'bg-green-500' : 'bg-neutral-500'
                                        }`} />
                                    {s.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Backdrop to close dropdown */}
                    {isDropdownOpen && (
                        <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                    )}
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => onShowScript(lead)}
                        className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2 group/btn"
                        title="View Outreach Script"
                    >
                        <MessageSquare className="w-4 h-4 group-hover/btn:text-indigo-400" />
                        <span className="text-xs font-medium hidden group-hover:block">Script</span>
                    </button>

                    {lead.source_link && (
                        <a
                            href={lead.source_link}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors group/btn"
                            title="Visit Website"
                        >
                            <ExternalLink className="w-4 h-4 group-hover/btn:text-blue-400" />
                        </a>
                    )}
                </div>
            </td>
        </tr>
    );
}
