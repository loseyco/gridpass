import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, Clock, Wrench } from "lucide-react";
import { ContactForm } from "./ContactForm";

export default function AutomotiveConsultingPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-amber-500/30">
            {/* Hero Section */}
            <section className="relative overflow-hidden py-24 lg:py-32">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col items-center space-y-4 text-center">
                        <Badge variant="outline" className="border-amber-500/50 text-amber-500 px-3 py-1 text-sm uppercase tracking-wider backdrop-blur-sm">
                            Private Client Services
                        </Badge>
                        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
                            Technical Stewardship <br className="hidden md:block" />
                            <span className="text-white">For Elite Assets.</span>
                        </h1>
                        <p className="mx-auto max-w-[700px] text-slate-400 md:text-xl/relaxed lg:text-2xl/relaxed">
                            Your "Right Hand Man" for automotive logistics, fleet management, and complex problem solving.
                            IndyCar engineering precision brought to your private collection.
                        </p>
                        <div className="flex flex-col gap-2 min-[400px]:flex-row pt-4">
                            <Button asChild size="lg" className="bg-amber-600 hover:bg-amber-700 text-white border-none">
                                <Link href="#contact">
                                    Book a 10-Minute Coffee
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="lg" className="border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white">
                                <Link href="/u/pjlosey">View Full Profile</Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Background Gradient/Mesh */}
                <div className="absolute top-0 z-[-1] h-full w-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,50,0,0.15),rgba(255,255,255,0))]"></div>
            </section>

            {/* Value Proposition Grid */}
            <section className="container px-4 md:px-6 py-12 lg:py-24">
                <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
                    {/* Card 1: Stewardship */}
                    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                        <CardHeader>
                            <ShieldCheck className="h-10 w-10 text-amber-500 mb-2" />
                            <CardTitle className="text-xl text-slate-100">Asset Stewardship</CardTitle>
                            <CardDescription className="text-slate-400">
                                More than just storage.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-slate-400 space-y-2">
                            <p>
                                Cyclical exercising of static assets, fluid circulation, and tire cradle management to prevent "lot rot."
                            </p>
                            <ul className="grid gap-2 text-sm pt-2">
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    <span>MoTeC/Cosworth Health Checks</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    <span>Preventative Datalogging</span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Card 2: Logistics */}
                    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                        <CardHeader>
                            <Clock className="h-10 w-10 text-amber-500 mb-2" />
                            <CardTitle className="text-xl text-slate-100">Concierge Logistics</CardTitle>
                            <CardDescription className="text-slate-400">
                                White-glove coordination.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-slate-400 space-y-2">
                            <p>
                                Door-to-door coordination for service appointments, concours events, or track days. Zero-incident execution.
                            </p>
                            <ul className="grid gap-2 text-sm pt-2">
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    <span>Transport Management</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    <span>Vendor/Shop Liason</span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Card 3: Technical Director */}
                    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                        <CardHeader>
                            <Wrench className="h-10 w-10 text-amber-500 mb-2" />
                            <CardTitle className="text-xl text-slate-100">Technical Director</CardTitle>
                            <CardDescription className="text-slate-400">
                                Your technical proxy.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-slate-400 space-y-2">
                            <p>
                                Managing complex technical projects—from restoration oversight to smart home integration—so you don't have to.
                            </p>
                            <ul className="grid gap-2 text-sm pt-2">
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    <span>Restoration Oversight</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    <span>Acquisition Inspection</span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Experience Section */}
            <section className="border-t border-slate-800 bg-slate-900/20 py-12 lg:py-24">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col items-center justify-center space-y-4 text-center">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-white">Provenance Matters.</h2>
                        <p className="max-w-[700px] text-slate-400 md:text-xl/relaxed">
                            Trusted with the world's most significant automotive assets.
                        </p>
                    </div>

                    <div className="mx-auto grid max-w-5xl gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4 items-center justify-items-center opacity-70">
                        {/* Simple text placeholders for logos/brands - can be replaced with images later */}
                        <div className="text-2xl font-bold text-slate-600">INDYCAR</div>
                        <div className="text-2xl font-bold text-slate-600">McLAREN P1</div>
                        <div className="text-2xl font-bold text-slate-600">FERRARI LaFERRARI</div>
                        <div className="text-2xl font-bold text-slate-600">PORSCHE 918</div>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact" className="container px-4 md:px-6 py-12 lg:py-24">
                <div className="mx-auto max-w-2xl space-y-8">
                    <div className="space-y-2 text-center">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-white">Let's Solve Problems.</h2>
                        <p className="text-slate-400">
                            Based in Grayslake. Available for Lake Bluff, Lake Forest, and North Shore private clients.
                            Text or email to discuss your needs.
                        </p>
                    </div>

                    <Card className="bg-slate-950 border-amber-900/20 shadow-2xl shadow-amber-900/10">
                        <CardHeader>
                            <CardTitle className="text-slate-100">Contact PJ Losey</CardTitle>
                            <CardDescription>
                                Direct line for Principals and Estate Managers.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Button className="w-full bg-slate-100 text-slate-900 hover:bg-slate-200" size="lg" asChild>
                                    <a href="mailto:pj@pjlosey.com">Email: pj@pjlosey.com</a>
                                </Button>
                                {/* Placeholder for a real form integration later */}
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-slate-800" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-slate-950 px-2 text-slate-500">Or send a message</span>
                                    </div>
                                </div>
                                <form className="grid gap-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <label htmlFor="name" className="text-sm font-medium leading-none text-slate-400">Name</label>
                                            <input className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2 focus:ring-offset-slate-950" id="name" placeholder="Name" />
                                        </div>
                                        <div className="grid gap-2">
                                            <label htmlFor="email" className="text-sm font-medium leading-none text-slate-400">Email</label>
                                            <input className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2 focus:ring-offset-slate-950" id="email" placeholder="project@example.com" />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <label htmlFor="message" className="text-sm font-medium leading-none text-slate-400">How can I help?</label>
                                        <textarea className="flex min-h-[80px] w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2 focus:ring-offset-slate-950" id="message" placeholder="I have a collection that needs oversight..." />
                                    </div>
                                    <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white">Send Message</Button>
                                </form>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>
        </div>
    );
}
