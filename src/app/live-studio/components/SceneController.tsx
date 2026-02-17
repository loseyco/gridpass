'use client';

import { useState, useEffect } from 'react';
import NewsScene from './NewsScene';
import MemberScene from './MemberScene';
import { AnimatePresence, motion } from 'framer-motion';

const SCENES = ['NEWS', 'MEMBERS'];
const SCENE_DURATION = 15000; // 15 seconds per scene

export default function SceneController() {
    const [currentSceneIndex, setCurrentSceneIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSceneIndex((prev) => (prev + 1) % SCENES.length);
        }, SCENE_DURATION);

        return () => clearInterval(interval);
    }, []);

    const currentScene = SCENES[currentSceneIndex];

    return (
        <div className="w-[1920px] h-[1080px] bg-black text-white overflow-hidden relative">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentScene}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0"
                >
                    {currentScene === 'NEWS' && <NewsScene />}
                    {currentScene === 'MEMBERS' && <MemberScene />}
                </motion.div>
            </AnimatePresence>

            {/* Persistent Overlay / Ticker */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-red-600 flex items-center px-8 z-50">
                <div className="font-bold text-xl mr-8">LIVE</div>
                <div className="text-lg animate-marquee whitespace-nowrap overflow-hidden">
                    GridPass Broadcast • 24/7 Coverage • Join the community at gridpass.app
                </div>
            </div>
        </div>
    );
}
