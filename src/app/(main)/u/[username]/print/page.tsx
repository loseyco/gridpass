import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { Globe, Instagram, Twitter, Youtube, Linkedin, Mail, Phone, MapPin, Printer } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

export const dynamic = 'force-dynamic'

interface PageProps {
    params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { username } = await params;
    return {
        title: `Resume - ${username} | GridPass`,
        robots: {
            index: false,
            follow: false
        }
    };
}

export default async function PrintResumePage({ params }: PageProps) {
    const { username } = await params
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // Fetch profile
    const { data: profile } = await supabase
        .from('os_user_profiles')
        .select('*')
        .ilike('username', username)
        .single()

    if (!profile) {
        notFound()
    }

    // Fetch Work History
    const { data: workHistory } = await supabase
        .from('os_user_work_history')
        .select('*')
        .eq('user_id', profile.id)
        .order('start_date', { ascending: false })

    // Fetch Skills
    const { data: userSkills } = await supabase
        .from('os_user_skills')
        .select('skill')
        .eq('user_id', profile.id)

    const skills = userSkills?.map(s => s.skill) || []

    // Fetch recommendations
    const { data: recommendations } = await adminSupabase
        .from('recommendations')
        .select(`
            *,
            from_profile:author_id (
                id,
                username,
                full_name,
                avatar_url
            )
        `)
        .eq('target_user_id', profile.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })

    // Fetch public vehicles (reusing logic from main page, but simpler)
    // We will show all vehicles that are not in a private collection for now
    const { data: publicVehicles } = await adminSupabase
        .from('user_vehicles')
        .select('*, collection:collections(id, name, visibility)')
        .eq('user_id', profile.id)

    // Construct full name
    const fullName = profile.first_name && profile.last_name
        ? `${profile.first_name} ${profile.last_name}`
        : (profile.first_name || profile.username);

    return (
        <div className="min-h-screen bg-white text-black p-8 max-w-[8.5in] mx-auto print:p-0 print:max-w-none">

            {/* Print Control - Hidden when printing */}
            <div className="mb-8 flex justify-between items-center no-print">
                <a href={`/u/${profile.username}`} className="text-sm text-gray-500 hover:text-black">
                    ← Back to Profile
                </a>
                <button
                    onClick="window.print()"
                    className="bg-black text-white px-4 py-2 rounded-md font-bold flex items-center gap-2 hover:bg-gray-800 transition-colors"
                >
                    <Printer size={18} />
                    Print Resume
                </button>
            </div>

            {/* Header */}
            <header className="border-b-2 border-black pb-6 mb-8 flex justify-between items-start">
                <div>
                    <h1 className="text-4xl font-extrabold uppercase tracking-tight mb-2 leading-none">
                        {fullName}
                    </h1>
                    <p className="text-lg text-gray-700 font-medium mb-4">@{profile.username}</p>

                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-800">
                        {profile.logistics_info?.hometown && (
                            <div className="flex items-center gap-1.5">
                                <MapPin size={14} />
                                {profile.logistics_info.hometown}
                            </div>
                        )}
                        {profile.show_public_phone && profile.public_phone && (
                            <div className="flex items-center gap-1.5">
                                <Phone size={14} />
                                {profile.public_phone}
                            </div>
                        )}
                        {profile.show_public_email && profile.public_email && (
                            <div className="flex items-center gap-1.5">
                                <Mail size={14} />
                                {profile.public_email}
                            </div>
                        )}

                        {/* Socials as Text */}
                        {profile.website && (
                            <div className="flex items-center gap-1.5">
                                <Globe size={14} />
                                {profile.website.replace(/^https?:\/\//, '')}
                            </div>
                        )}
                        {profile.social_links?.linkedin && (
                            <div className="flex items-center gap-1.5">
                                <Linkedin size={14} />
                                {profile.social_links.linkedin.split('/').pop()}
                            </div>
                        )}
                        {profile.social_links?.instagram && (
                            <div className="flex items-center gap-1.5">
                                <Instagram size={14} />
                                {profile.social_links.instagram.split('/').pop()}
                            </div>
                        )}
                    </div>
                </div>

                <div className="text-right shrink-0">
                    <div className="w-24 h-24 ml-auto mb-2">
                        <QRCodeSVG value={`https://gridpass.app/u/${profile.username}`} size={96} />
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono">gridpass.app/u/{profile.username}</div>
                </div>
            </header>

            {/* Professional Summary */}
            {profile.bio && profile.bio !== 'Old Profile Table Data - LEGACY' && (
                <section className="mb-0">
                    <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 pb-1 mb-3">Professional Summary</h2>
                    <p className="text-sm leading-relaxed text-gray-800 mb-6">
                        {profile.bio}
                    </p>
                </section>
            )}

            {/* Experience */}
            {workHistory && workHistory.length > 0 && (
                <section className="mb-6">
                    <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 pb-1 mb-4">Experience</h2>
                    <div className="space-y-4">
                        {workHistory.map((entry: any) => (
                            <div key={entry.id} className="break-inside-avoid">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="font-bold text-base">{entry.title || entry.position || entry.role}</h3>
                                    <span className="text-xs text-gray-600 font-medium">
                                        {entry.period || `${entry.start_date} - ${entry.end_date || 'Present'}`}
                                    </span>
                                </div>
                                {(entry.company || entry.team_name) && (
                                    <div className="text-sm font-semibold text-gray-700 mb-1">
                                        {entry.company || entry.team_name}
                                    </div>
                                )}
                                {entry.description && (
                                    <p className="text-sm text-gray-800 leading-snug">
                                        {entry.description}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <div className="grid grid-cols-2 gap-8 mb-6">
                {/* Skills */}
                {skills && skills.length > 0 && (
                    <section className="break-inside-avoid">
                        <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 pb-1 mb-3">Skills</h2>
                        <div className="flex flex-wrap gap-2">
                            {skills.map((skill: string) => (
                                <span key={skill} className="text-xs font-medium border border-gray-400 rounded px-2 py-1">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </section>
                )}

                {/* Gear / Physical Stats */}
                {(profile.physical_info?.helmet_size || profile.physical_info?.suit_size || profile.physical_info?.shoe_size) && (
                    <section className="break-inside-avoid">
                        <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 pb-1 mb-3">Gear Stats</h2>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            {profile.physical_info?.helmet_size && (
                                <div className="border border-gray-200 p-2 rounded">
                                    <div className="text-xs text-gray-500 uppercase mb-1">Helmet</div>
                                    <div className="font-bold">{profile.physical_info.helmet_size}</div>
                                </div>
                            )}
                            {profile.physical_info?.suit_size && (
                                <div className="border border-gray-200 p-2 rounded">
                                    <div className="text-xs text-gray-500 uppercase mb-1">Suit</div>
                                    <div className="font-bold">{profile.physical_info.suit_size}</div>
                                </div>
                            )}
                            {profile.physical_info?.shoe_size && (
                                <div className="border border-gray-200 p-2 rounded">
                                    <div className="text-xs text-gray-500 uppercase mb-1">Shoe</div>
                                    <div className="font-bold">{profile.physical_info.shoe_size}</div>
                                </div>
                            )}
                        </div>
                    </section>
                )}
            </div>

            {/* Garage */}
            {publicVehicles && publicVehicles.length > 0 && (
                <section className="mb-6 break-inside-avoid">
                    <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 pb-1 mb-4">Garage</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {publicVehicles.map((vehicle: any) => (
                            <div key={vehicle.id} className="border border-gray-300 rounded p-3 flex gap-3 break-inside-avoid">
                                <div className="grow">
                                    <h3 className="font-bold text-sm">
                                        {vehicle.year} {vehicle.make} {vehicle.model}
                                    </h3>
                                    <div className="text-xs font-medium text-gray-600 uppercase mt-0.5">{vehicle.type}</div>
                                    {vehicle.description && (
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                            {vehicle.description}
                                        </p>
                                    )}
                                    {vehicle.specs && Object.keys(vehicle.specs).length > 0 && (
                                        <div className="mt-2 text-[10px] text-gray-500 grid grid-cols-2 gap-x-2">
                                            {Object.entries(vehicle.specs).slice(0, 4).map(([k, v]) => (
                                                <div key={k}><span className="font-medium">{k}:</span> {String(v)}</div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Recommendations */}
            {recommendations && recommendations.length > 0 && (
                <section className="mb-6 break-inside-avoid">
                    <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 pb-1 mb-4">Recommendations</h2>
                    <div className="space-y-4">
                        {recommendations.slice(0, 3).map((rec: any) => (
                            <div key={rec.id} className="bg-gray-50 p-3 rounded border border-gray-100 break-inside-avoid">
                                <p className="text-sm text-gray-800 italic mb-2">"{rec.content}"</p>
                                <div className="text-xs font-bold text-gray-600">
                                    — {rec.from_profile?.full_name || rec.author_name || 'Guest User'}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <footer className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
                Generated by GridPass - The Operating System for Motorsports
            </footer>

            <script dangerouslySetInnerHTML={{
                __html: `
                // Auto-print prompt if query param present? No, let user click.
                // But add the click handler for the button
                document.querySelector('button').addEventListener('click', () => window.print());
            `}} />
        </div>
    )
}
