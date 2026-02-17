'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, MapPin } from 'lucide-react';
import { useFormState } from 'react-dom';
import { submitContactForm } from '@/actions/contact';

const initialState = {
    message: '',
    success: false,
    errors: {}
};

export default function ContactPage() {
    const [state, formAction] = useFormState(submitContactForm, initialState);

    return (
        <div className="min-h-screen bg-black text-white p-8 pt-24 flex flex-col items-center">
            <div className="max-w-4xl w-full">
                <h1 className="text-4xl font-bold mb-8 text-center uppercase italic">Contact Us</h1>

                <div className="grid md:grid-cols-2 gap-12">
                    {/* Information */}
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-xl font-bold mb-4 text-cyan-500">Get in Touch</h3>
                            <p className="text-gray-400">
                                Have a question about GridPass? Want to partner with us?
                                Fill out the form or reach out directly.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4 text-gray-300">
                                <div className="p-3 rounded-full bg-zinc-900 border border-zinc-800">
                                    <Mail className="h-5 w-5" />
                                </div>
                                <span>support@gridpass.app</span>
                            </div>
                            <div className="flex items-center gap-4 text-gray-300">
                                <div className="p-3 rounded-full bg-zinc-900 border border-zinc-800">
                                    <MapPin className="h-5 w-5" />
                                </div>
                                <span>Austin, TX</span>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <Card className="p-6 bg-zinc-900/50 border-zinc-800">
                        <form className="space-y-4" action={formAction}>
                            {state?.message && (
                                <div className={`p-4 rounded-md mb-4 ${state.success ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                    {state.message}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-gray-500">First Name</label>
                                    <Input name="firstName" placeholder="Ayrtan" className="bg-black border-white/10" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-gray-500">Last Name</label>
                                    <Input name="lastName" placeholder="Senna" className="bg-black border-white/10" required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500">Email</label>
                                <Input name="email" type="email" placeholder="racer@example.com" className="bg-black border-white/10" required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500">Message</label>
                                <Textarea name="message" placeholder="How can we help?" className="bg-black border-white/10 min-h-[120px]" required />
                            </div>
                            <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold">
                                Send Message
                            </Button>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
}
