import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'About Us',
    description: 'GridPass is dedicated to unifying the fragmented world of motorsports. Built by racers, for racers.',
    openGraph: {
        images: ['/hero-launch.png'],
    },
}

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-black text-white p-8 pt-24 flex flex-col items-center">
            <div className="max-w-4xl w-full space-y-8">
                <div className="text-center space-y-4">
                    <h1 className="text-5xl font-black italic tracking-tighter">
                        GRID<span className="text-red-600">PASS</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        The Operating System for your Motorsports Life.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <Card className="p-6 bg-zinc-900 border-zinc-800 text-gray-300 space-y-4">
                        <h2 className="text-2xl font-bold text-white">Our Mission</h2>
                        <p>
                            GridPass is dedicated to unifying the fragmented world of motorsports.
                            From sim racing leagues to track day logistics, we provide the tools drivers need
                            to focus on what matters: driving.
                        </p>
                    </Card>
                    <Card className="p-6 bg-zinc-900 border-zinc-800 text-gray-300 space-y-4">
                        <h2 className="text-2xl font-bold text-white">The Platform</h2>
                        <p>
                            Built by racers, for racers. GridPass integrates identity, reputation,
                            logistics, and competition management into a single, seamless experience.
                        </p>
                    </Card>
                </div>

                <div className="text-center pt-8">
                    <Link href="/contact">
                        <Button variant="outline" className="border-white/20 hover:bg-white/10">
                            Get in Touch
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
