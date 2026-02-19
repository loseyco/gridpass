'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from 'framer-motion'
import { X, Heart, Star } from 'lucide-react'

interface CardData {
    id: string
    [key: string]: any
}

interface SwiperProps {
    cards: CardData[]
    renderCard: (card: CardData) => React.ReactNode
    onSwipe: (cardId: string, direction: 'left' | 'right' | 'up') => void
    onCardLeftScreen: (cardId: string) => void
}

export default function Swiper({ cards, renderCard, onSwipe, onCardLeftScreen }: SwiperProps) {
    const [index, setIndex] = useState(0)

    // Only show the top 2 cards for performance
    const activeCards = cards.slice(index, index + 2)

    const handleSwipe = (direction: 'left' | 'right' | 'up') => {
        if (index < cards.length) {
            onSwipe(cards[index].id, direction)
            onCardLeftScreen(cards[index].id)
            setIndex(prev => prev + 1)
        }
    }

    if (index >= cards.length) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-neutral-500">
                <div className="bg-neutral-900/50 p-8 rounded-full mb-4">
                    <Star className="w-12 h-12 text-yellow-500 opacity-50" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">You're all caught up!</h3>
                <p>Check back later for more matches.</p>
            </div>
        )
    }

    return (
        <div className="relative w-full max-w-md mx-auto h-[600px] flex items-center justify-center">
            {activeCards.map((card, i) => {
                // The top card is always the first in the activeCards array (since we slice)
                const isTop = card.id === cards[index].id

                return (
                    <SwipeableCard
                        key={card.id}
                        data={card}
                        renderCard={renderCard}
                        onSwipe={handleSwipe}
                        isTop={isTop}
                    />
                )
            }).reverse()}

            {/* Controls */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-6 z-50">
                <button
                    onClick={() => handleSwipe('left')}
                    className="w-14 h-14 bg-neutral-900 border border-red-500/30 text-red-500 rounded-full flex items-center justify-center shadow-lg hover:bg-red-500/10 hover:scale-110 transition-all"
                >
                    <X size={28} strokeWidth={3} />
                </button>
                <button
                    onClick={() => handleSwipe('up')}
                    className="w-10 h-10 bg-neutral-900 border border-blue-500/30 text-blue-500 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-500/10 hover:scale-110 transition-all mt-2"
                >
                    <Star size={20} strokeWidth={3} />
                </button>
                <button
                    onClick={() => handleSwipe('right')}
                    className="w-14 h-14 bg-neutral-900 border border-green-500/30 text-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-500/10 hover:scale-110 transition-all"
                >
                    <Heart size={28} strokeWidth={3} />
                </button>
            </div>
        </div>
    )
}

interface SwipeableCardProps {
    data: CardData
    renderCard: (card: CardData) => React.ReactNode
    onSwipe: (direction: 'left' | 'right' | 'up') => void
    isTop: boolean
}

function SwipeableCard({ data, renderCard, onSwipe, isTop }: SwipeableCardProps) {
    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const rotate = useTransform(x, [-200, 200], [-25, 25])
    const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0])

    // Color overlays based on swipe direction
    const nopeOpacity = useTransform(x, [-150, -25], [1, 0])
    const likeOpacity = useTransform(x, [25, 150], [0, 1])
    const superOpacity = useTransform(y, [-150, -25], [1, 0])

    const controls = useAnimation()

    const handleDragEnd = async (event: any, info: PanInfo) => {
        const threshold = 100
        const velocity = info.velocity.x

        if (info.offset.x > threshold || velocity > 500) {
            await controls.start({ x: 500, opacity: 0, transition: { duration: 0.2 } })
            onSwipe('right')
        } else if (info.offset.x < -threshold || velocity < -500) {
            await controls.start({ x: -500, opacity: 0, transition: { duration: 0.2 } })
            onSwipe('left')
        } else if (info.offset.y < -threshold) {
            await controls.start({ y: -500, opacity: 0, transition: { duration: 0.2 } })
            onSwipe('up')
        }
        else {
            controls.start({ x: 0, y: 0 })
        }
    }

    // Automatically swipe generic method for buttons
    useEffect(() => {
        // If this component was unmounted by parent index change, 
        // framer motion unmount animation handles it.
    }, [])

    return (
        <motion.div
            style={{
                x,
                y,
                rotate: isTop ? rotate : 0,
                opacity: isTop ? opacity : 1,
                zIndex: isTop ? 10 : 0,
                scale: isTop ? 1 : 0.95,
            }}
            drag={isTop ? true : false}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            onDragEnd={handleDragEnd}
            animate={controls}
            initial={{ scale: 0.95, opacity: 0 }}
            whileInView={{ scale: isTop ? 1 : 0.95, opacity: 1 }}
            className="absolute top-0 w-full h-full cursor-grab active:cursor-grabbing origin-bottom"
        >
            {/* Card Content */}
            <div className="relative w-full h-full bg-neutral-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                {renderCard(data)}

                {/* Swipe Overlays */}
                {isTop && (
                    <>
                        <motion.div style={{ opacity: likeOpacity }} className="absolute top-8 left-8 border-4 border-green-500 rounded-xl px-4 py-2 rotate-[-15deg] z-20 pointer-events-none">
                            <span className="text-4xl font-black text-green-500 uppercase tracking-widest">YES</span>
                        </motion.div>
                        <motion.div style={{ opacity: nopeOpacity }} className="absolute top-8 right-8 border-4 border-red-500 rounded-xl px-4 py-2 rotate-[15deg] z-20 pointer-events-none">
                            <span className="text-4xl font-black text-red-500 uppercase tracking-widest">NOPE</span>
                        </motion.div>
                        <motion.div style={{ opacity: superOpacity }} className="absolute bottom-24 left-1/2 -translate-x-1/2 border-4 border-blue-500 rounded-xl px-4 py-2 z-20 pointer-events-none">
                            <span className="text-4xl font-black text-blue-500 uppercase tracking-widest">SUPER</span>
                        </motion.div>
                    </>
                )}
            </div>
        </motion.div>
    )
}
