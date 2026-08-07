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
            const mockUser = (window as any).__MOCK_USER__;
            if (mockUser === null) {
                // Explicitly logged out
                setUser(null);
            } else {
                const u = mockUser || {
                    uid: 'pjlosey',
                    email: 'driver@gridpass.app',
                    displayName: 'PJ LOSEY'
                };
                setUser({
                    uid: u.uid || u.id || 'pjlosey',
                    email: u.email || 'driver@gridpass.app',
                    displayName: u.display_name || u.displayName || 'PJ LOSEY',
                    emailVerified: true,
                    getIdToken: async () => 'mock-id-token-12345'
                } as any);
            }
            setLoading(false);
            return;
        }

        console.log("[AuthProvider] Mounting listener...");

        // Safety timeout for mobile/slow IP network initialization
        const safetyTimeout = setTimeout(() => {
            console.warn("[AuthProvider] Auth listener safety timeout reached (2s). Forcing loading: false.");
            setLoading(false);
        }, 2000);

        const unsubscribe = onIdTokenChanged(auth, async (user) => {
            clearTimeout(safetyTimeout);
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

                    // Automatically sync & link profile, admin status, and vehicles
                    import('@/lib/auth-linker').then(({ syncAndLinkUserAccount }) => {
                        syncAndLinkUserAccount(user);
                    });

                } catch (err) {
                    console.error("[AuthProvider] Failed to fetch token:", err);
                }
            }
            console.log("[AuthProvider] Setting loading to false");
            setLoading(false)
        })

        return () => {
            clearTimeout(safetyTimeout);
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
