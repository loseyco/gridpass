
import { AgencyCandidate } from "@/types/agency";
import { X, MapPin, Calendar, Clock, DollarSign, PenTool, User, FileText, Globe, Facebook, Linkedin, Instagram, Twitter, Youtube } from "lucide-react";

interface CandidateDetailViewProps {
    candidate: AgencyCandidate;
    onClose: () => void;
    onEdit: () => void;
}

export function CandidateDetailView({ candidate, onClose, onEdit }: CandidateDetailViewProps) {
    const socialIcon = (platform: string) => {
        switch (platform.toLowerCase()) {
            case 'linkedin': return <Linkedin size={16} />;
            case 'facebook': return <Facebook size={16} />;
            case 'instagram': return <Instagram size={16} />;
            case 'twitter': return <Twitter size={16} />;
            case 'youtube': return <Youtube size={16} />;
            default: return <Globe size={16} />;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto backdrop-blur-sm">
            <div className="w-full max-w-4xl bg-neutral-900 rounded-2xl border border-white/10 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header with Cover/Avatar style if we had cover, simple for now */}
                <div className="p-6 border-b border-white/10 flex items-start justify-between bg-white/5">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-neutral-800 overflow-hidden border-2 border-white/10">
                            {candidate.contact_info?.avatar_url ? (
                                <img src={candidate.contact_info.avatar_url} alt={candidate.name} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-neutral-600">
                                    <User size={32} />
                                </div>
                            )}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                {candidate.name}
                                {candidate.source_type === 'profile' && (
                                    <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-0.5 rounded-full border border-purple-500/30">
                                        PRO MEMBER
                                    </span>
                                )}
                            </h2>
                            <p className="text-neutral-400 text-lg">{candidate.role || "Candidate"}</p>
                            <div className="flex items-center gap-4 text-sm text-neutral-500 mt-1">
                                {candidate.logistics_info?.hometown && (
                                    <span className="flex items-center gap-1"><MapPin size={14} /> {candidate.logistics_info.hometown}</span>
                                )}
                                <span className={`px-2 py-0.5 rounded text-xs uppercase tracking-wider ${candidate.status === 'approved' ? 'bg-blue-500/10 text-blue-400' : 'bg-neutral-500/10 text-neutral-400'}`}>
                                    {candidate.status}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={onEdit} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition">
                            <PenTool size={20} />
                        </button>
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* Key Recruitment Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                            <div className="text-neutral-500 text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                                <Clock size={12} /> Availability
                            </div>
                            <div className="text-white font-medium">{candidate.availability || "Not specificed"}</div>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                            <div className="text-neutral-500 text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                                <DollarSign size={12} /> Desired Salary
                            </div>
                            <div className="text-white font-medium">{candidate.desired_salary || "Negotiable"}</div>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                            <div className="text-neutral-500 text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                                <MapPin size={12} /> Relocation
                            </div>
                            <div className="text-white font-medium">
                                {candidate.relocation_prefs?.willing ? "Willing to relocate" : "Local only"}
                            </div>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                            <div className="text-neutral-500 text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                                <Calendar size={12} /> Age / DOB
                            </div>
                            <div className="text-white font-medium">
                                {candidate.date_of_birth ? new Date(candidate.date_of_birth).toLocaleDateString() : "N/A"}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Left Column: Skills & Gear */}
                        <div className="space-y-8">
                            <section>
                                <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3">Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                    {candidate.skills?.map(skill => (
                                        <span key={skill} className="px-2.5 py-1 rounded-lg bg-neutral-800 text-sm text-neutral-300 border border-white/5">
                                            {skill}
                                        </span>
                                    ))}
                                    {!candidate.skills?.length && <span className="text-neutral-600 italic">No skills listed</span>}
                                </div>
                            </section>

                            <section>
                                <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3">Logistics & Gear</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between py-2 border-b border-white/5">
                                        <span className="text-neutral-400">Home Airport</span>
                                        <span className="text-white">{candidate.logistics_info?.home_airport || "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-white/5">
                                        <span className="text-neutral-400">Helmet Size</span>
                                        <span className="text-white">{candidate.physical_info?.helmet_size || "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-white/5">
                                        <span className="text-neutral-400">Suit Size</span>
                                        <span className="text-white">{candidate.physical_info?.suit_size || "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-white/5">
                                        <span className="text-neutral-400">Shoe Size</span>
                                        <span className="text-white">{candidate.physical_info?.shoe_size || "N/A"}</span>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Middle/Right Column: Contact & Files */}
                        <div className="md:col-span-2 space-y-8">
                            <section>
                                <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3">Contact & Links</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {candidate.contact_info?.email && (
                                        <div className="p-3 rounded bg-white/5 border border-white/5">
                                            <div className="text-xs text-neutral-500">Email</div>
                                            <div className="text-white truncate">{candidate.contact_info.email}</div>
                                        </div>
                                    )}
                                    {candidate.contact_info?.phone && (
                                        <div className="p-3 rounded bg-white/5 border border-white/5">
                                            <div className="text-xs text-neutral-500">Phone</div>
                                            <div className="text-white truncate">{candidate.contact_info.phone}</div>
                                        </div>
                                    )}
                                    {candidate.resume_url && (
                                        <a href={candidate.resume_url} target="_blank" className="p-3 rounded bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition group">
                                            <div className="text-xs text-blue-400 flex items-center gap-1 mb-1">
                                                <FileText size={12} /> Resume / CV
                                            </div>
                                            <div className="text-blue-300 text-sm group-hover:underline">View Document</div>
                                        </a>
                                    )}
                                    {candidate.linkedin_url && (
                                        <a href={candidate.linkedin_url} target="_blank" className="p-3 rounded bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition group">
                                            <div className="text-xs text-blue-400 flex items-center gap-1 mb-1">
                                                <Linkedin size={12} /> LinkedIn
                                            </div>
                                            <div className="text-blue-300 text-sm group-hover:underline">View Profile</div>
                                        </a>
                                    )}
                                </div>
                            </section>

                            {(candidate.social_links && Object.keys(candidate.social_links).length > 0) && (
                                <section>
                                    <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3">Social Media</h3>
                                    <div className="flex gap-3">
                                        {Object.entries(candidate.social_links).map(([platform, url]) => (
                                            <a key={platform} href={url as string} target="_blank" className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white transition border border-white/5">
                                                {socialIcon(platform)}
                                            </a>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {candidate.notes && (
                                <section>
                                    <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3">Notes</h3>
                                    <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/10 text-yellow-100/80 text-sm leading-relaxed whitespace-pre-wrap">
                                        {candidate.notes}
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
