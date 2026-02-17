'use client'

import React, { useState, useEffect, useRef, use } from 'react'
import { MapPin, Navigation, Info } from 'lucide-react'
import { updateOrganizationLocation } from '@/app/actions/organizations'
// import { getOrganizationBySlug } from '@/app/actions/organizations' 

export default function LocationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: orgId } = use(params)
    const [isLive, setIsLive] = useState(false)
    const [status, setStatus] = useState('Offline')
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
    const watchIdRef = useRef<number | null>(null)

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current)
            }
        }
    }, [])

    const toggleLive = () => {
        if (isLive) {
            // Stop watching
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current)
                watchIdRef.current = null
            }
            setIsLive(false)
            setStatus('Offline')
        } else {
            // Start watching
            if (!navigator.geolocation) {
                alert('Geolocation is not supported by your browser')
                return
            }

            setStatus('Seeking location...')
            watchIdRef.current = navigator.geolocation.watchPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords
                    setStatus(`Live: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
                    setLastUpdate(new Date())

                    try {
                        console.log('Sending location:', latitude, longitude)
                        await updateOrganizationLocation(orgId, latitude, longitude)
                    } catch (error) {
                        console.error('Failed to update server location:', error)
                        setStatus('Error updating server')
                    }
                },
                (error) => {
                    console.error('Geolocation error:', error)
                    setStatus('Error reading location')
                    setIsLive(false)
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            )
            setIsLive(true)
        }
    }

    return (
        <div className="location-page">
            <div className="header">
                <MapPin size={32} className="header-icon" />
                <div>
                    <h1>Location Manager</h1>
                    <p>Manage where your business appears on the map.</p>
                </div>
            </div>

            <div className="card live-card">
                <div className="live-header">
                    <div className="live-icon-container">
                        <Navigation size={24} className={isLive ? 'animate-pulse' : ''} />
                    </div>
                    <div>
                        <h2>Live Tracking</h2>
                        <p>Share your real-time location with customers (Great for Mobile Businesses)</p>
                    </div>
                    <div className="toggle-container">
                        <button
                            className={`toggle-btn ${isLive ? 'active' : ''}`}
                            onClick={toggleLive}
                        >
                            {isLive ? 'STOP TRACKING' : 'GO LIVE'}
                        </button>
                    </div>
                </div>

                <div className="status-bar">
                    <span className={`status-indicator ${isLive ? 'online' : 'offline'}`}></span>
                    <span>Status: {status}</span>
                    {lastUpdate && <span className="last-update">Last update: {lastUpdate.toLocaleTimeString()}</span>}
                </div>

                <p className="info-text">
                    <Info size={16} style={{ display: 'inline', marginRight: '4px' }} />
                    Keep this tab open while you are mobile to keep your location updated on the map.
                </p>
            </div>

            <div className="card manual-card">
                <h2>Fixed Address</h2>
                <p style={{ color: '#888', marginBottom: '1rem' }}>Use this if you are at a permanent location (Shop, Garage, etc.)</p>
                <div className="coming-soon">Manual entry coming soon</div>
            </div>

            <style jsx>{`
                .location-page {
                    max-width: 800px;
                }
                .header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 2rem;
                }
                .header-icon {
                    color: var(--v2-accent-primary);
                }
                h1 {
                    font-size: 1.5rem;
                    margin: 0;
                }
                p {
                    color: #888;
                    margin: 0;
                }
                .card {
                    background: #111;
                    border: 1px solid #333;
                    border-radius: 12px;
                    padding: 1.5rem;
                    margin-bottom: 1.5rem;
                }
                .live-card {
                    border-color: ${isLive ? 'var(--v2-accent-primary)' : '#333'};
                }
                .live-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1rem;
                }
                .live-icon-container {
                    color: ${isLive ? 'var(--v2-accent-primary)' : '#666'};
                }
                .toggle-container {
                    margin-left: auto;
                }
                .toggle-btn {
                    background: ${isLive ? '#ff4d4d' : '#4ade80'};
                    color: #000;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 0 10px ${isLive ? 'rgba(255, 77, 77, 0.4)' : 'rgba(74, 222, 128, 0.4)'};
                }
                .toggle-btn:hover {
                    opacity: 0.9;
                }
                .status-bar {
                    background: #000;
                    padding: 0.75rem;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-family: monospace;
                    margin-bottom: 1rem;
                }
                .status-indicator {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                }
                .online { background: #4ade80; box-shadow: 0 0 8px #4ade80; }
                .offline { background: #666; }
                .last-update {
                    margin-left: auto;
                    color: #666;
                    font-size: 0.8rem;
                }
                .info-text {
                    font-size: 0.875rem;
                    color: #aaa;
                }
                .manual-card {
                    opacity: 0.7;
                }
             `}</style>
        </div>
    )
}
