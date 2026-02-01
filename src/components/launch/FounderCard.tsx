"use client";

import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { MouseEvent } from "react";
import { Shield, Star, Check, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";

import { useReferral } from "@/hooks/useReferral";

import { calculateFounderPrice, getNextPricePrediction, PRICING_CONSTANTS } from "@/utils/pricing";

interface FounderCardProps {
    soldCount: number;
}

export function FounderCard({ soldCount }: FounderCardProps) {
    const referrer = useReferral();
    let mouseX = useMotionValue(0);
    let mouseY = useMotionValue(0);

    const currentPrice = calculateFounderPrice(soldCount);
    const nextPrice = getNextPricePrediction(soldCount);

    // Savings against the final price ($1,500)
    const FINAL_PRICE = 1500;
    const savings = FINAL_PRICE - currentPrice;
    const savingsPercent = Math.round((savings / FINAL_PRICE) * 100);

    const remaining = PRICING_CONSTANTS.TOTAL_SPOTS - soldCount;

    function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
        let { left, top } = currentTarget.getBoundingClientRect();

        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    return (
        <div
            className="group relative max-w-md w-full rounded-xl bg-neutral-900 border border-white/10 px-8 py-12 shadow-2xl"
            onMouseMove={handleMouseMove}
        >
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(99, 102, 241, 0.15),
              transparent 80%
            )
          `,
                }}
            />

            {/* Holographic Border Glow */}
            <div className="absolute inset-0 rounded-xl border-2 border-transparent bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none animate-gradient-xy" />

            <div className="relative z-10 flex flex-col items-center text-center">
                {/* Scarcity Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold uppercase tracking-widest mb-6 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    Only {remaining} / {PRICING_CONSTANTS.TOTAL_SPOTS} Spots Left
                </div>

                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/20 border-t border-white/20">
                    <Shield className="w-10 h-10 text-white fill-white/20" />
                </div>

                <h3 className="text-3xl font-black text-white mb-1 tracking-tight">
                    FOUNDER PACK
                </h3>
                <p className="text-neutral-500 text-sm mb-6 font-mono uppercase tracking-widest">
                    Founder Spot #{soldCount + 1}
                </p>

                <div className="flex flex-col items-center mb-8 bg-neutral-800/50 p-4 rounded-xl border border-white/5 w-full">
                    <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-white">${currentPrice}</span>
                        <span className="text-lg text-neutral-500 font-medium">/ lifetime</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-sm">
                        <span className="text-green-400 font-bold">Save {savingsPercent}%</span>
                        <span className="text-neutral-600 line-through decoration-white/10">$1,500</span>
                    </div>
                    <div className="mt-2 text-xs text-amber-500 font-mono">
                        ⚠️ Price Increases to ${nextPrice} after next sale
                    </div>
                </div>

                <ul className="space-y-3 mb-8 text-left">
                    <li className="flex items-center gap-2 text-sm text-neutral-300">
                        <Check className="w-4 h-4 text-emerald-500" /> Lifetime Pro Access
                    </li>
                    <li className="flex items-center gap-2 text-sm text-neutral-300">
                        <Check className="w-4 h-4 text-emerald-500" /> Founder Badge on Profile
                    </li>
                    <li className="flex items-center gap-2 text-sm text-neutral-300">
                        <Check className="w-4 h-4 text-emerald-500" /> Advisory Council Seat
                    </li>
                    <li className="flex items-center gap-2 text-sm text-neutral-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-neutral-600 ml-1.5 mr-0.5"></div>
                        Single User License
                    </li>
                </ul>

                <Link
                    href={`/founder/checkout${referrer ? `?ref=${referrer}` : ''}`}
                    className="w-full py-4 bg-white text-black rounded-xl font-black text-lg hover:scale-105 transition-transform duration-200 shadow-xl shadow-white/10 flex items-center justify-center gap-2 group-hover:bg-indigo-500 group-hover:text-white"
                >
                    SECURE SPOT #{soldCount + 1}
                    <ArrowRight className="w-5 h-5" />
                </Link>

                <p className="mt-4 text-xs text-neutral-500">
                    Secure checkout via Stripe. 30-day money-back guarantee.
                </p>
            </div>
        </div>
    );
}
