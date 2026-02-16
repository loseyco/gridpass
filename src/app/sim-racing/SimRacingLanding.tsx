'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Monitor, Smartphone, Gauge, MapPin, Download, Check } from 'lucide-react';
import Link from 'next/link';

export function SimRacingLanding() {
    return (
        <div className="bg-black text-white min-h-[80vh] flex flex-col items-center justify-center p-6 space-y-12">
            {/* Hero */}
            <div className="text-center space-y-4 max-w-2xl mx-auto">
                <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-yellow-400 to-amber-600 bg-clip-text text-transparent">
                    GridPass Sim Control
                </h1>
                <p className="text-xl text-neutral-400">
                    Control your Sim Racing Rig from anywhere. <br />
                    Launch sims, monitor telemetry, and manage your hardware remotely.
                </p>
                <div className="flex gap-4 justify-center pt-4">
                    <a href="/GridPass_Client.zip" download>
                        <Button size="lg" className="bg-white text-black hover:bg-neutral-200">
                            <Download className="mr-2 h-5 w-5" /> Download Client
                        </Button>
                    </a>
                    <Link href="/login?next=/sim-racing">
                        <Button size="lg" variant="outline" className="border-neutral-700 hover:bg-neutral-900">
                            Log In to Dashboard
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl w-full">
                <FeatureCard
                    icon={<Monitor className="h-8 w-8 text-blue-500" />}
                    title="Remote Launch"
                    desc="Start iRacing, Assetto Corsa, and other sims from your phone or laptop while walking to your rig."
                />
                <FeatureCard
                    icon={<Gauge className="h-8 w-8 text-yellow-500" />}
                    title="Live Telemetry"
                    desc="View real-time speed, RPM, fuel, and lap times from any device on your network."
                />
                <FeatureCard
                    icon={<Smartphone className="h-8 w-8 text-green-500" />}
                    title="Hardware Stats"
                    desc="Monitor CPU/GPU temps and usage to ensure your PC is ready to race."
                />
            </div>

            {/* How to Start */}
            <div className="max-w-3xl w-full bg-neutral-900/50 rounded-xl p-8 border border-neutral-800">
                <h2 className="text-2xl font-bold mb-6 text-center">How to Get Started</h2>
                <div className="space-y-4">
                    <Step number={1} title="Download Client" desc="Get the native GridPass app for your Sim PC." />
                    <Step number={2} title="Run GridPass" desc="Extract and run GridPass.exe (no install needed)." />
                    <Step number={3} title="Connect" desc="The client connects to your GridPass account instantly." />
                    <Step number={4} title="Race" desc="See your device appear here and take control!" />
                </div>
            </div>
        </div>
    );
}

function FeatureCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
    return (
        <Card className="bg-neutral-900/30 border-neutral-800">
            <CardContent className="p-6 text-center space-y-4">
                <div className="mx-auto bg-neutral-900 w-16 h-16 rounded-full flex items-center justify-center border border-neutral-800">
                    {icon}
                </div>
                <h3 className="font-bold text-lg">{title}</h3>
                <p className="text-sm text-neutral-400">{desc}</p>
            </CardContent>
        </Card>
    )
}

function Step({ number, title, desc }: { number: number, title: string, desc: string }) {
    return (
        <div className="flex items-start gap-4">
            <div className="bg-neutral-800 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                {number}
            </div>
            <div>
                <h4 className="font-bold text-white">{title}</h4>
                <p className="text-sm text-neutral-400">{desc}</p>
            </div>
        </div>
    )
}
