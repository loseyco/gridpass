'use client'

import { useEffect, useState } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { CircleHelp } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function JobBoardTutorial() {

    const startTour = () => {
        const driverObj = driver({
            showProgress: true,
            animate: true,
            steps: [
                {
                    element: '#job-board-header',
                    popover: {
                        title: 'Welcome to GridPass Jobs',
                        description: 'Your central hub for motorsports opportunities. Whether you need work or talent, this is the place.'
                    }
                },
                {
                    element: '#view-mode-toggle',
                    popover: {
                        title: 'Choose Your Mode',
                        description: 'Toggle between "Find Work" (for professionals) and "Find Talent" (for teams/agencies).'
                    }
                },
                {
                    element: '#filter-bar',
                    popover: {
                        title: 'Filter & Search',
                        description: 'Narrow down results by location, role name, or specific criteria like "Remote" or "Within 50 Miles".'
                    }
                },
                {
                    element: '#job-tabs',
                    popover: {
                        title: 'Browse Your Way',
                        description: 'Use "Racer Match" for a Tinder-like experience, or browse list views for "Gigs" and "Full-Time Jobs".'
                    }
                },
                {
                    element: '#job-content-area',
                    popover: {
                        title: 'Matches & Listings',
                        description: 'Swipe right on cards you like, or click "Apply" on list items. We\'ll notify the other party instantly!'
                    }
                }
            ]
        })

        driverObj.drive()
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={startTour}
            className="fixed bottom-6 right-6 z-50 rounded-full w-12 h-12 bg-emerald-500 text-black shadow-xl hover:bg-emerald-400 hover:scale-105 transition-all"
            aria-label="Start Tutorial"
        >
            <CircleHelp className="w-6 h-6" />
        </Button>
    )
}
