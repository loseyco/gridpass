'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, Bell, Facebook, MessageCircle } from 'lucide-react';

const MESSAGES = [
    { icon: ThumbsUp, text: 'LIKE THE STREAM', subtext: 'Helps us grow!', color: 'text-blue-500' },
    { icon: Bell, text: 'SUBSCRIBE', subtext: 'Don\'t miss a race', color: 'text-red-500' },
    { icon: Facebook, text: 'FOLLOW US', subtext: 'LuxeCorsaAutoSuites', color: 'text-blue-600' },
    { icon: MessageCircle, text: 'JOIN DISCORD', subtext: 'Chat with drivers', color: 'text-indigo-500' },
];

export default function LikeSubscribePopup() {
    const [visible, setVisible] = useState(false);
    const [msgIndex, setMsgIndex] = useState(0);

    useEffect(() => {
        // Show popup every 45 seconds, stay for 8 seconds
        const showInterval = setInterval(() => {
            setMsgIndex(prev => (prev + 1) % MESSAGES.length);
            setVisible(true);

            setTimeout(() => {
                setVisible(false);
            }, 8000);

        }, 45000);

        return () => clearInterval(showInterval);
    }, []);

    const msg = MESSAGES[msgIndex];
    const Icon = msg.icon;

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ x: 300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 300, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="absolute bottom-8 right-8 z-[100] bg-white text-black p-4 rounded-xl shadow-2xl flex items-center gap-4 border-l-8 border-red-600 max-w-sm"
                >
                    <div className={`p-3 rounded-full bg-slate-100 ${msg.color}`}>
                        <Icon className="w-8 h-8" />
                    </div>
                    <div>
                        <div className="font-black text-xl italic uppercase leading-none mb-1">
                            {msg.text}
                        </div>
                        <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                            {msg.subtext}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
