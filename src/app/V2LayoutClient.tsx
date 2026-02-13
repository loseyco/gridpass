'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function V2LayoutClient({
    children,
    isLoggedIn = false,
}: {
    children: React.ReactNode
    isLoggedIn?: boolean
}) {
    const pathname = usePathname()
    const isLandingPage = pathname === '/' && !isLoggedIn

    useEffect(() => {
        // Hide V1 navbar, footer, and other chrome elements
        const elementsToHide = [
            'nav[class*="navbar"]',
            'footer',
            '[class*="AlphaBanner"]',
            '[class*="ImpersonationBar"]',
            '[class*="SuspendedBanner"]',
            '[class*="MobileInstallPrompt"]',
            '[class*="FeedbackWidget"]',
        ]

        const hiddenElements: HTMLElement[] = []

        elementsToHide.forEach((selector) => {
            const elements = document.querySelectorAll(selector)
            elements.forEach((el) => {
                if (el instanceof HTMLElement && el.style.display !== 'none') {
                    hiddenElements.push(el)
                    el.style.display = 'none'
                }
            })
        })

        // Auto-hide address bar on mobile
        const hideAddressBar = () => {
            if (window.scrollY === 0) {
                window.scrollTo(0, 1)
            }
        }

        // Trigger on load and orientation change
        hideAddressBar()
        window.addEventListener('orientationchange', hideAddressBar)

        // Cleanup on unmount
        return () => {
            hiddenElements.forEach((el) => {
                el.style.display = ''
            })
            window.removeEventListener('orientationchange', hideAddressBar)
        }
    }, [])

    return (
        <div className={`v2-container ${isLandingPage ? 'v2-landing-container' : ''}`}>
            {children}
            <style jsx global>{`
                /* Full width override for landing page */
                @media (min-width: 768px) {
                    .v2-container.v2-landing-container {
                        max-width: 100%;
                        border: none;
                        box-shadow: none;
                        background: #000000;
                    }
                }
            `}</style>
        </div>
    )
}
