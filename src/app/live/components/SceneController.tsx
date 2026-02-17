'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import BroadcastOverlay from './BroadcastOverlay';
import FieldMarshal from './FieldMarshal';
import NewsScene from './NewsScene';
import SpotlightScene from './SpotlightScene';
import GarageScene from './GarageScene';
import MemberScene from './MemberScene';
import PromoScene from './PromoScene';
import ScheduleScene from './ScheduleScene';
import { AnimatePresence, motion } from 'framer-motion';

const SCENES = ['NEWS', 'SPOTLIGHT', 'GARAGE', 'PROMO', 'SCHEDULE', 'MEMBERS'];
const SCENE_DURATION = 15000; // 15 seconds per scene

export default function SceneController() {
    const [currentSceneIndex, setCurrentSceneIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSceneIndex((prev: number) => (prev + 1) % SCENES.length);
        }, SCENE_DURATION);

        return () => clearInterval(timer);
    }, []);

    const CurrentSceneComponent = () => {
        switch (SCENES[currentSceneIndex]) {
            case 'NEWS':
                return <NewsScene />;
            case 'SPOTLIGHT':
                return <SpotlightScene />;
            case 'GARAGE':
                return <GarageScene />;
            case 'PROMO':
                return <PromoScene />;
            case 'SCHEDULE':
                return <ScheduleScene />;
            case 'MEMBERS':
                return <MemberScene />;
            default:
                return <NewsScene />;
        }
    };

    return (
        <div className="w-full h-full relative bg-slate-950">
            <BroadcastOverlay />
            <FieldMarshal />

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentSceneIndex}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="w-full h-full absolute inset-0"
                >
                    <CurrentSceneComponent />
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
