'use client';

import { useState } from 'react';
import { updateInquiryStatus } from '@/app/actions/inquiries';
import { Mail, Phone, Calendar, Archive, CheckCircle, MessageSquare, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Inquiry {
    id: string;
    service_id: string;
    sender_name: string;
    sender_email: string;
    sender_phone?: string;
    message: string;
    project_details: any;
    status: 'pending' | 'read' | 'replied' | 'archived';
    created_at: string;
    user_services: {
        title: string;
    };
}

export default function InquiryList({ initialInquiries }: { initialInquiries: Inquiry[] }) {
    const [inquiries, setInquiries] = useState<Inquiry[]>(initialInquiries);
    const [activeTab, setActiveTab] = useState<'pending' | 'replied' | 'archived'>('pending');
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const filteredInquiries = inquiries.filter(inquiry => {
        if (activeTab === 'pending') return inquiry.status === 'pending' || inquiry.status === 'read';
        return inquiry.status === activeTab;
    });

    async function handleStatusUpdate(id: string, newStatus: 'read' | 'replied' | 'archived' | 'pending') {
        setUpdatingId(id);
        const result = await updateInquiryStatus(id, newStatus);

        if (result.success) {
            setInquiries(prev => prev.map(inq =>
                inq.id === id ? { ...inq, status: newStatus } : inq
            ));
        }
        setUpdatingId(null);
    }

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-white/5 pb-1">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors ${activeTab === 'pending'
                            ? 'text-white border-b-2 border-indigo-500 bg-white/5'
                            : 'text-neutral-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    Inbox
                </button>
                <button
                    onClick={() => setActiveTab('replied')}
                    className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors ${activeTab === 'replied'
                            ? 'text-white border-b-2 border-indigo-500 bg-white/5'
                            : 'text-neutral-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    Replied
                </button>
                <button
                    onClick={() => setActiveTab('archived')}
                    className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors ${activeTab === 'archived'
                            ? 'text-white border-b-2 border-indigo-500 bg-white/5'
                            : 'text-neutral-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    Archived
                </button>
            </div>

            {/* List */}
            <div className="space-y-4">
                {filteredInquiries.length === 0 ? (
                    <div className="text-center py-12 text-neutral-500 bg-white/5 rounded-xl border border-dashed border-white/10">
                        <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No inquiries found in this section.</p>
                    </div>
                ) : (
                    filteredInquiries.map((inquiry) => (
                        <div
                            key={inquiry.id}
                            className={`bg-neutral-900 border rounded-xl p-6 transition-all hover:border-indigo-500/30 ${inquiry.status === 'pending' ? 'border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'border-white/5'
                                }`}
                        >
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Header / Meta */}
                                <div className="md:w-1/4 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${inquiry.status === 'pending' ? 'bg-indigo-500 animate-pulse' : 'bg-neutral-500'}`} />
                                        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                                            {formatDistanceToNow(new Date(inquiry.created_at), { addSuffix: true })}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-white text-lg">{inquiry.sender_name}</h3>
                                        <a href={`mailto:${inquiry.sender_email}`} className="text-sm text-indigo-400 hover:underline flex items-center gap-2">
                                            <Mail className="w-3 h-3" />
                                            {inquiry.sender_email}
                                        </a>
                                        {inquiry.sender_phone && (
                                            <div className="text-sm text-neutral-400 flex items-center gap-2 mt-1">
                                                <Phone className="w-3 h-3" />
                                                {inquiry.sender_phone}
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-3 bg-white/5 rounded-lg">
                                        <p className="text-xs text-neutral-500 mb-1">Interested in:</p>
                                        <p className="text-sm font-bold text-white line-clamp-2">{inquiry.user_services?.title || 'Unknown Service'}</p>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 space-y-4">
                                    <div className="bg-black/20 p-4 rounded-lg text-neutral-300 text-sm whitespace-pre-wrap">
                                        {inquiry.message}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-3 pt-2">
                                        <a
                                            href={`mailto:${inquiry.sender_email}?subject=Re: Inquiry for ${inquiry.user_services?.title}&body=\n\n> ${inquiry.message.substring(0, 100)}...`}
                                            onClick={() => handleStatusUpdate(inquiry.id, 'replied')}
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg flex items-center gap-2 transition-colors"
                                        >
                                            <Mail className="w-4 h-4" />
                                            Reply via Email
                                        </a>

                                        {inquiry.status !== 'archived' && (
                                            <button
                                                onClick={() => handleStatusUpdate(inquiry.id, 'archived')}
                                                disabled={updatingId === inquiry.id}
                                                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors"
                                            >
                                                <Archive className="w-4 h-4" />
                                                Archive
                                            </button>
                                        )}

                                        {inquiry.status === 'pending' && (
                                            <button
                                                onClick={() => handleStatusUpdate(inquiry.id, 'read')}
                                                disabled={updatingId === inquiry.id}
                                                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                Mark as Read
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
