'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'

export default function ShareButton() {
  const [showToast, setShowToast] = useState(false)
  const pathname = usePathname()

  // Hide on edit pages
  if (pathname?.includes('/edit')) return null

  const handleShare = async () => {
    // Get current URL and append affiliate code
    // For now using placeholder - you'll need to fetch actual user affiliate code
    const baseUrl = window.location.origin + pathname
    const affiliateCode = 'ref=user123' // TODO: Replace with actual user's affiliate code
    const shareUrl = `${baseUrl}?${affiliateCode}`

    const shareData = {
      title: 'GridPass',
      text: 'Check out GridPass - The Business Operating System for Racing',
      url: shareUrl,
    }

    try {
      // Try native share API (mobile)
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData)
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareUrl)
        setShowToast(true)
        setTimeout(() => setShowToast(false), 2000)
      }
    } catch (err) {
      // User cancelled or error
      console.log('Share cancelled')
    }
  }

  return (
    <>
      <button onClick={handleShare} className="share-button" aria-label="Share">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      </button>

      {showToast && (
        <div className="share-toast">
          Link copied!
        </div>
      )}

      <style jsx>{`
        .share-button {
          position: fixed;
          top: 1rem;
          right: 1rem;
          width: 48px;
          height: 48px;
          background: var(--v2-glass-bg);
          border: 1px solid var(--v2-glass-border);
          backdrop-filter: blur(var(--v2-glass-blur));
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 80;
          box-shadow: var(--v2-shadow-md);
          color: white;
          transition: all 0.2s;
        }

        .share-button:hover {
          background: rgba(255,255,255,0.1);
          box-shadow: var(--v2-shadow-lg);
          transform: scale(1.05);
          border-color: white;
        }

        .share-button:active {
          transform: scale(0.95);
        }

        .share-toast {
          position: fixed;
          top: 5rem;
          right: 1rem;
          background: var(--v2-accent-primary);
          color: white;
          padding: 0.75rem 1rem;
          border-radius: var(--v2-radius-sm);
          font-size: var(--v2-text-sm);
          font-weight: var(--v2-font-bold);
          box-shadow: var(--v2-shadow-lg);
          z-index: 90;
          animation: slideIn 0.2s ease-out;
          font-family: var(--v2-font-racing);
          font-style: italic;
          text-transform: uppercase;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (min-width: 768px) {
          .share-button {
            right: calc(50% - var(--v2-max-width) / 2 + 1rem);
          }

          .share-toast {
            right: calc(50% - var(--v2-max-width) / 2 + 1rem);
          }
        }
      `}</style>
    </>
  )
}
