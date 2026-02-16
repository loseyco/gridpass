import React from 'react'
import NotificationSettings from '@/components/settings/NotificationSettings'

export default function SettingsPage() {
    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-2">Settings</h1>
            <p className="text-[#888] mb-8">Manage your account and application preferences.</p>

            <div className="space-y-6">
                <section>
                    <h2 className="text-xl font-semibold mb-4 text-[#ddd]">Notifications</h2>
                    <NotificationSettings />
                </section>

                {/* Placeholder for other settings */}
                <section className="opacity-50 pointer-events-none">
                    <h2 className="text-xl font-semibold mb-4 text-[#ddd]">Security (Coming Soon)</h2>
                    <div className="bg-[#111] border border-[#333] rounded-xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-medium text-white">Two-Factor Authentication</h3>
                                <p className="text-sm text-[#888]">Secure your account with an authenticator app.</p>
                            </div>
                            <button disabled className="px-4 py-2 rounded-lg text-sm font-medium bg-[#222] text-[#666] border border-[#333]">
                                Coming Soon
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}
