import { useState, useEffect } from 'react'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}

export function usePushNotifications() {
    const [isSupported, setIsSupported] = useState(false)
    const [subscription, setSubscription] = useState<PushSubscription | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true)
            registerServiceWorker()
        } else {
            setLoading(false)
        }
    }, [])

    const registerServiceWorker = async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js')
            const existingSubscription = await registration.pushManager.getSubscription()
            setSubscription(existingSubscription)

            // If we have a subscription, ensure it's synced with the backend
            // This handles cases where the DB might have been cleared but the browser is still subscribed
            if (existingSubscription) {
                await saveSubscriptionToBackend(existingSubscription)
            }
        } catch (err) {
            console.error('Service Worker registration failed:', err)
            setError('Failed to register service worker')
        } finally {
            setLoading(false)
        }
    }

    const saveSubscriptionToBackend = async (sub: PushSubscription) => {
        try {
            const response = await fetch('/api/web-push/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(sub),
            })

            if (!response.ok) {
                console.error('Failed to sync subscription to backend')
            }
        } catch (error) {
            console.error('Error syncing subscription:', error)
        }
    }

    const subscribe = async () => {
        setLoading(true)
        setError(null)
        try {
            if (!VAPID_PUBLIC_KEY) {
                throw new Error('VAPID public key not found')
            }

            const registration = await navigator.serviceWorker.ready
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            })

            // Send subscription to backend
            const response = await fetch('/api/web-push/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(sub),
            })

            if (!response.ok) {
                throw new Error('Failed to save subscription on server')
            }

            setSubscription(sub)
            return true
        } catch (err: any) {
            console.error('Failed to subscribe:', err)
            setError(err.message || 'Failed to subscribe')
            return false
        } finally {
            setLoading(false)
        }
    }

    const unsubscribe = async () => {
        setLoading(true)
        try {
            // For now, we only unsubscribe locally from the push manager. 
            // In a real app, you might want to delete from the DB too, 
            // but the DB cleans up invalid endpoints automatically on send failure.
            if (subscription) {
                await subscription.unsubscribe()
                setSubscription(null)
            }
        } catch (err: any) {
            console.error('Failed to unsubscribe:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return {
        isSupported,
        subscription,
        subscribe,
        unsubscribe,
        loading,
        error,
    }
}
