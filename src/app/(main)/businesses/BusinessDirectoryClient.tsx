'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Organization } from '@/app/actions/organizations'
import { BusinessCard } from '@/components/organizations/BusinessCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, MapPin, Navigation } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

interface BusinessDirectoryClientProps {
    initialOrgs: Organization[]
}

export default function BusinessDirectoryClient({ initialOrgs }: BusinessDirectoryClientProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    // State
    const [search, setSearch] = useState(searchParams.get('q') || '')
    const [type, setType] = useState(searchParams.get('type') || 'all')
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null)
    const [isLocating, setIsLocating] = useState(false)
    const [locationError, setLocationError] = useState<string | null>(null)
    const [sortBy, setSortBy] = useState<'newest' | 'distance'>('newest')

    // Filter and Sort
    const filteredOrgs = useMemo(() => {
        let result = [...initialOrgs]

        // Filter by Type
        if (type !== 'all') {
            result = result.filter(org => org.type === type)
        }

        // Filter by Search (Client-side live search)
        if (search) {
            const q = search.toLowerCase()
            result = result.filter(org =>
                org.name.toLowerCase().includes(q) ||
                org.description?.toLowerCase().includes(q) ||
                org.location?.toLowerCase().includes(q)
            )
        }

        // Sort
        if (sortBy === 'distance' && userLocation) {
            result.sort((a, b) => {
                const distA = getDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude)
                const distB = getDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude)
                return distA - distB
            })
        }

        return result
    }, [initialOrgs, type, search, sortBy, userLocation])

    // Handlers
    const handleTypeChange = (newType: string) => {
        setType(newType)
        // Update URL without refresh
        const params = new URLSearchParams(searchParams)
        if (newType === 'all') params.delete('type')
        else params.set('type', newType)
        router.replace(`/businesses?${params.toString()}`, { scroll: false })
    }

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value)
        // Debounce URL update if needed, but for now just local state is fine for "live" feel
    }

    const handleLocateMe = () => {
        setIsLocating(true)
        setLocationError(null)

        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported by your browser')
            setIsLocating(false)
            return
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                })
                setSortBy('distance')
                setIsLocating(false)
            },
            (error) => {
                console.error('Error getting location:', error)
                setLocationError('Unable to retrieve your location')
                setIsLocating(false)
            }
        )
    }

    // Helper to calculate distance (Haversine formula) in miles
    function getDistance(lat1: number, lon1: number, lat2?: number, lon2?: number) {
        if (!lat2 || !lon2) return Infinity // Sort to bottom
        const R = 3959 // Radius of Earth in miles
        const dLat = deg2rad(lat2 - lat1)
        const dLon = deg2rad(lon2 - lon1)
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    function deg2rad(deg: number) {
        return deg * (Math.PI / 180)
    }

    return (
        <div>
            <div className="flex flex-col gap-6 mb-10">
                {/* Search Row */}
                <div className="relative flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-3.5 h-5 w-5 text-neutral-500" />
                        <Input
                            placeholder="Search businesses..."
                            className="pl-12 h-12 text-lg bg-neutral-900 border-white/10 text-white placeholder:text-neutral-600 focus:border-blue-500/50 focus:ring-blue-500/20 rounded-xl"
                            value={search}
                            onChange={handleSearchChange}
                        />
                    </div>
                    <Button
                        onClick={handleLocateMe}
                        variant={sortBy === 'distance' ? 'default' : 'outline'}
                        className={`h-12 w-12 px-0 flex-shrink-0 border-white/10 ${sortBy === 'distance' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
                        title="Sort by Distance (Near Me)"
                    >
                        {isLocating ? (
                            <div className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full" />
                        ) : (
                            <Navigation className={`h-5 w-5 ${sortBy === 'distance' ? 'fill-current' : ''}`} />
                        )}
                    </Button>
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap gap-2 items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                        {['all', 'service', 'shop', 'team', 'track'].map((t) => (
                            <Button
                                key={t}
                                onClick={() => handleTypeChange(t)}
                                variant="ghost"
                                className={`capitalize rounded-lg border h-9 px-4 ${type === t
                                    ? 'bg-white text-black border-white hover:bg-neutral-200'
                                    : 'bg-transparent text-neutral-400 border-white/5 hover:bg-white/5 hover:text-white'}`}
                            >
                                {t}
                            </Button>
                        ))}
                    </div>

                    {userLocation && (
                        <div className="text-xs text-emerald-500 font-mono flex items-center gap-2">
                            <Navigation className="w-3 h-3 fill-current" />
                            Using your location
                            <button onClick={() => { setUserLocation(null); setSortBy('newest'); }} className="text-neutral-500 hover:text-white underline ml-1">
                                Clear
                            </button>
                        </div>
                    )}
                </div>

                {locationError && (
                    <div className="text-red-400 text-sm">{locationError}</div>
                )}
            </div>

            {/* List */}
            <div className="flex flex-col gap-4">
                {filteredOrgs.length > 0 ? (
                    filteredOrgs.map((org) => {
                        const distance = userLocation ? getDistance(userLocation.lat, userLocation.lng, org.latitude, org.longitude) : null
                        return (
                            <div key={org.id} className="relative">
                                <BusinessCard org={org} />
                                {distance !== null && distance !== Infinity && (
                                    <div className="absolute top-4 right-4 md:right-auto md:left-[450px] bg-black/80 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-1.5 z-10">
                                        <MapPin className="w-3 h-3 text-blue-400" />
                                        {distance < 0.1 ? 'Here' : `${distance.toFixed(1)} mi`}
                                    </div>
                                )}
                            </div>
                        )
                    })
                ) : (
                    <div className="col-span-full py-20 text-center">
                        <div className="text-6xl mb-4">🏪</div>
                        <h3 className="text-xl font-semibold text-white">No businesses found</h3>
                        <p className="text-neutral-500 mt-2">Try adjusting your search or filters.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
