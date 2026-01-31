import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import RegisterForm from './RegisterForm';

export default async function RegisterPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        redirect('/dashboard');
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans flex items-center justify-center p-4">
            <div className="max-w-md w-full animate-fade-in">

                {/* Logo Header */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
                        <img src="/logo-square.png" alt="GridPass" className="w-12 h-12 rounded-xl shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform" />
                        <span className="font-bold text-2xl tracking-tighter">GridPass</span>
                    </Link>
                    <h1 className="text-xl font-bold text-white">Create Account</h1>
                    <p className="text-neutral-400 text-sm mt-1">Start your career on the grid.</p>
                </div>

                <RegisterForm />

                <div className="mt-8 text-center">
                    <Link href="/founder/register" className="inline-flex items-center gap-2 text-amber-500 text-xs font-bold uppercase tracking-widest hover:text-amber-400 border border-amber-500/20 bg-amber-500/5 px-4 py-2 rounded-full transition-colors">
                        Become a Founder <ChevronRight className="w-3 h-3" />
                    </Link>
                </div>

            </div>
        </div>
    );
}
