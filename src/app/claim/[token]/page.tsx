import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react'

interface PageProps {
    params: {
        token: string
    }
}

export default async function ClaimPage({ params }: PageProps) {
    const { token } = await params

    // Use Service Role to bypass RLS for verification
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Verify Token
    // 1. Verify Token
    const { data: claim, error: tokenError } = await supabase
        .from('os_claim_tokens')
        .select('*')
        .eq('token', token)
        .single()

    if (tokenError || !claim) {
        return <InvalidTokenView />
    }

    // 2. Fetch Lead Manually
    const { data: lead, error: leadError } = await supabase
        .from('os_leads')
        .select('name, role, contact_info')
        .eq('id', claim.entity_id)
        .single()

    // Combine for view
    const claimWithLead = {
        ...claim,
        lead: lead
    }

    // Helper component for error state to satisfy the return above
    function InvalidTokenView() {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
                <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Invalid or Expired Link</h1>
                <p className="text-zinc-400 mb-6 text-center max-w-md">
                    This invite link seems to be invalid. It may have already been used or expired.
                </p>
                <Link href="/" className="px-6 py-3 bg-zinc-800 rounded-lg font-bold hover:bg-zinc-700 transition">
                    Go Home
                </Link>
            </div>
        )
    }

    const leadName = claimWithLead.lead?.name || 'Racer'
    const leadRole = claimWithLead.lead?.role || 'Driver'

    return (
        <div className="min-h-screen bg-black text-white font-sans">
            <div className="max-w-md mx-auto pt-20 p-6 text-center">

                <div className="mb-8 flex justify-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/40">
                        <CheckCircle className="w-10 h-10 text-white" />
                    </div>
                </div>

                <h1 className="text-4xl font-black italic tracking-tighter mb-2 uppercase">
                    Welcome, <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                        {leadName}
                    </span>
                </h1>

                <p className="text-zinc-400 text-lg mb-8">
                    Your <strong>{leadRole}</strong> profile has been reserved on GridPass.
                </p>

                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-8 text-left">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Included in your profile</h3>
                    <ul className="space-y-3">
                        <li className="flex items-center gap-3 text-sm font-medium">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span>Professional Resume Builder</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm font-medium">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span>Verified Driver Status</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm font-medium">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span>Direct Team Messaging</span>
                        </li>
                    </ul>
                </div>

                <div className="space-y-4">
                    <Link
                        href={`/register?token=${token}&email=${encodeURIComponent(claimWithLead.lead?.contact_info?.email || '')}`}
                        className="block w-full py-4 bg-white text-black rounded-xl font-black uppercase tracking-wider hover:bg-zinc-200 transition transform active:scale-95 flex items-center justify-center gap-2"
                    >
                        Claim Profile <ArrowRight className="w-5 h-5" />
                    </Link>

                    <p className="text-xs text-zinc-600">
                        By claiming this profile, you agree to our Terms of Service.
                    </p>
                </div>

            </div>
        </div>
    )
}
