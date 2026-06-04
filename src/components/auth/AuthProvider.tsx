'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { auth } from '@/lib/firebase/config'
import { User, onIdTokenChanged } from 'firebase/auth'
import nookies from 'nookies'

interface AuthContextType {
    user: User | null
    loading: boolean
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__) {
            console.log("[AuthProvider] Playwright mock active.");
            setUser({
                uid: 'pjlosey',
                email: 'driver@gridpass.app',
                displayName: 'PJ LOSEY',
                emailVerified: true,
                getIdToken: async () => 'mock-id-token-12345'
            } as any);
            setLoading(false);
            return;
        }

        console.log("[AuthProvider] Mounting listener...");
        const unsubscribe = onIdTokenChanged(auth, async (user) => {
            console.log("[AuthProvider] onIdTokenChanged fired. User:", user ? "EXISTS" : "NULL");
            if (!user) {
                console.log("[AuthProvider] Setting user to NULL");
                setUser(null)
                nookies.set(undefined, 'token', '', { path: '/' })
            } else {
                console.log("[AuthProvider] Fetching token...");
                try {
                    const token = await user.getIdToken()
                    console.log("[AuthProvider] Token fetched successfully, length:", token.length);
                    setUser(user)
                    nookies.set(undefined, 'token', token, { path: '/' })
                } catch (err) {
                    console.error("[AuthProvider] Failed to fetch token:", err);
                }
            }
            console.log("[AuthProvider] Setting loading to false");
            setLoading(false)
        })

        return () => {
            console.log("[AuthProvider] Unmounting listener...");
            unsubscribe();
        }
    }, [])

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
