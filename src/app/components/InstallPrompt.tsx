'use client'

import { useEffect, useState } from 'react'

export default function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    setIsStandalone(standalone)

    if (standalone) return

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Check if already dismissed
    const dismissed = localStorage.getItem('v2-install-dismissed')
    if (dismissed) return

    // Show after short delay
    const timer = setTimeout(() => {
      setShowPrompt(true)
    }, 2000)

    // Android PWA install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Android - use native prompt
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        setShowPrompt(false)
      }
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('v2-install-dismissed', 'true')
  }

  if (!showPrompt || isStandalone) return null

  return (
    <div className="install-prompt">
      <div className="install-content">
        {isIOS ? (
          <>
            <div className="install-icon">📱</div>
            <div className="install-text">
              <strong>Install GridPass</strong>
              <p>Tap <ShareIcon /> then "Add to Home Screen"</p>
            </div>
          </>
        ) : (
          <>
            <div className="install-icon">📱</div>
            <div className="install-text">
              <strong>Install GridPass</strong>
              <p>Get the app experience</p>
            </div>
            <button onClick={handleInstall} className="install-button">
              Install
            </button>
          </>
        )}
        <button onClick={handleDismiss} className="dismiss-button" aria-label="Dismiss">
          ×
        </button>
      </div>

      <style jsx>{`
        .install-prompt {
          position: fixed;
          bottom: calc(var(--v2-tab-bar-height) + 1rem);
          left: 1rem;
          right: 1rem;
          z-index: 90;
          animation: slideUp 0.3s ease-out;
        }

        .install-content {
          background: var(--v2-glass-bg);
          border: 1px solid var(--v2-glass-border);
          backdrop-filter: blur(var(--v2-glass-blur));
          border-radius: var(--v2-radius-md);
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          box-shadow: var(--v2-shadow-lg);
          position: relative;
        }

        .install-content::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            bottom: 0;
            width: 4px;
            background: var(--v2-accent-primary);
            border-radius: var(--v2-radius-md) 0 0 var(--v2-radius-md);
        }

        .install-icon {
          font-size: 2rem;
          line-height: 1;
        }

        .install-text {
          flex: 1;
        }

        .install-text strong {
          display: block;
          font-size: var(--v2-text-base);
          font-weight: var(--v2-font-black);
          color: white;
          margin-bottom: 0.25rem;
          text-transform: uppercase;
          font-style: italic;
        }

        .install-text p {
          font-size: var(--v2-text-sm);
          color: var(--v2-text-secondary);
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .install-button {
          padding: 0.625rem 1.25rem;
          background: var(--v2-accent-primary);
          color: white;
          border: none;
          border-radius: var(--v2-radius-sm);
          font-size: var(--v2-text-sm);
          font-weight: var(--v2-font-bold);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
          text-transform: uppercase;
          font-style: italic;
          clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
        }

        .install-button:hover {
          background: var(--v2-accent-primary-hover);
        }

        .dismiss-button {
          background: none;
          border: none;
          color: var(--v2-text-tertiary);
          font-size: 1.5rem;
          line-height: 1;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }

        .dismiss-button:hover {
          color: white;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (min-width: 768px) {
          .install-prompt {
            left: 50%;
            transform: translateX(-50%);
            max-width: calc(var(--v2-max-width) - 2rem);
          }
        }
      `}</style>
    </div>
  )
}

function ShareIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'inline-block', verticalAlign: 'middle', color: 'var(--v2-accent-primary)' }}
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  )
}
