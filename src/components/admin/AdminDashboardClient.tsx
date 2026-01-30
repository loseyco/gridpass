
'use client';

import { useState, useEffect } from 'react';
import { getOrganizations, createOrganization } from '@/actions/super-admin';
import {
    Building2,
    Users,
    Trophy,
    Wrench,
    Plus,
    Search,
    X,
    Loader2
} from "lucide-react";

export default function AdminDashboardClient() {
    const [orgs, setOrgs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        loadOrgs();
    }, []);

    async function loadOrgs() {
        setLoading(true);
        const res = await getOrganizations();
        if (res.success) {
            setOrgs(res.data || []);
        }
        setLoading(false);
    }

    const filteredOrgs = filter === 'All'
        ? orgs
        : orgs.filter(o => o.type === filter.toLowerCase() || (filter === 'Teams' && o.type === 'race_team'));

    // Stats Logic
    const stats = {
        total: orgs.length,
        teams: orgs.filter(o => o.type === 'race_team').length,
        shops: orgs.filter(o => o.type === 'shop').length,
        active: orgs.filter(o => o.status === 'active').length
    };

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Organization Hub</h1>
                    <p className="text-neutral-400">Manage shops, teams, and event organizers.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
                >
                    <Plus className="w-5 h-5" /> New Organization
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <StatCard title="Total Orgs" value={stats.total} icon={<Building2 className="text-indigo-400" />} />
                <StatCard title="Active Shops" value={stats.shops} icon={<Wrench className="text-blue-400" />} />
                <StatCard title="Race Teams" value={stats.teams} icon={<Trophy className="text-yellow-400" />} />
                <StatCard title="Total Active" value={stats.active} icon={<Users className="text-emerald-400" />} />
            </div>

            {/* Main Content Area */}
            <div className="bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden min-h-[400px]">

                {/* Toolbar */}
                <div className="p-4 border-b border-white/5 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
                        <input
                            type="text"
                            placeholder="Search organizations..."
                            className="w-full bg-neutral-950 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>
                    <div className="flex bg-neutral-950 p-1 rounded-lg border border-white/5">
                        {['All', 'Shop', 'Teams', 'Organizer'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === f ? 'bg-indigo-600 text-white' : 'text-neutral-500 hover:text-white'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table List */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 text-neutral-500 animate-spin" />
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {filteredOrgs.length === 0 ? (
                            <div className="p-8 text-center text-neutral-500">No organizations found.</div>
                        ) : (
                            filteredOrgs.map((org) => (
                                <div key={org.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border border-white/5 ${org.type === 'shop' ? 'bg-blue-500/10 text-blue-400' :
                                            org.type === 'race_team' ? 'bg-yellow-500/10 text-yellow-400' :
                                                'bg-neutral-800 text-neutral-400'
                                            }`}>
                                            {org.type === 'shop' && <Wrench className="w-6 h-6" />}
                                            {org.type === 'race_team' && <Trophy className="w-6 h-6" />}
                                            {org.type === 'organizer' && <Building2 className="w-6 h-6" />}
                                            {org.type === 'private' && <Users className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">{org.name}</h3>
                                            <div className="flex items-center gap-2 text-xs text-neutral-500 uppercase tracking-wider font-medium">
                                                <span>{org.type?.replace('_', ' ') || 'Unknown'}</span>
                                                <span className="w-1 h-1 bg-neutral-700 rounded-full"></span>
                                                <span className="text-neutral-600">ID: {org.id.slice(0, 8)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold border ${org.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-neutral-800 text-neutral-400 border-white/10'
                                            }`}>
                                            {org.status?.toUpperCase() || 'UNKNOWN'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-neutral-500 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h2 className="text-xl font-bold mb-4">Create Organization</h2>

                        <form action={async (formData) => {
                            await createOrganization(formData);
                            setIsModalOpen(false);
                            loadOrgs();
                        }} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-1">Org Name</label>
                                <input
                                    name="name"
                                    required
                                    className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                                    placeholder="e.g. Speed Demon Racing"
                                />
                            </div>

                            <div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-400 mb-2">Organization Type & Features</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        <label className="flex items-start gap-3 p-3 rounded-lg border border-white/10 cursor-pointer hover:bg-white/5 has-[:checked]:bg-indigo-500/20 has-[:checked]:border-indigo-500 transition-all">
                                            <input type="radio" name="type" value="shop" required defaultChecked className="mt-1" />
                                            <div>
                                                <div className="flex items-center gap-2 font-bold mb-1">
                                                    <Wrench className="w-4 h-4 text-blue-400" /> Auto Shop
                                                </div>
                                                <p className="text-xs text-neutral-500">Includes: CRM, Work Orders, Invoices, Inventory.</p>
                                            </div>
                                        </label>

                                        <label className="flex items-start gap-3 p-3 rounded-lg border border-white/10 cursor-pointer hover:bg-white/5 has-[:checked]:bg-indigo-500/20 has-[:checked]:border-indigo-500 transition-all">
                                            <input type="radio" name="type" value="race_team" className="mt-1" />
                                            <div>
                                                <div className="flex items-center gap-2 font-bold mb-1">
                                                    <Trophy className="w-4 h-4 text-yellow-400" /> Race Team
                                                </div>
                                                <p className="text-xs text-neutral-500">Includes: Logistics (Flights/Hotels), Setup Sheets, Run Logs.</p>
                                            </div>
                                        </label>

                                        <label className="flex items-start gap-3 p-3 rounded-lg border border-white/10 cursor-pointer hover:bg-white/5 has-[:checked]:bg-indigo-500/20 has-[:checked]:border-indigo-500 transition-all">
                                            <input type="radio" name="type" value="organizer" className="mt-1" />
                                            <div>
                                                <div className="flex items-center gap-2 font-bold mb-1">
                                                    <Building2 className="w-4 h-4 text-purple-400" /> Event Organizer
                                                </div>
                                                <p className="text-xs text-neutral-500">Includes: Ticketing, Parking Management, Waivers.</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl mt-4 border border-indigo-500/50 shadow-lg shadow-indigo-900/20"
                            >
                                Create Hub
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ title, value, icon }: any) {
    return (
        <div className="bg-neutral-900 border border-white/5 p-6 rounded-2xl">
            <div className="flex items-start justify-between mb-4">
                <h3 className="text-neutral-400 font-medium text-sm">{title}</h3>
                {icon}
            </div>
            <p className="text-3xl font-bold">{value}</p>
        </div>
    );
}
