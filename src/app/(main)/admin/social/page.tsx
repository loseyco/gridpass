import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { getFacebookAuthUrl, exchangeFacebookToken, publishToFacebook } from './actions'
import { FacebookFeed } from '@/components/FacebookFeed'

export default async function SocialDashboard({
    searchParams,
}: {
    searchParams: { code?: string; error?: string }
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Handle OAuth Callback
    if (searchParams.code) {
        try {
            await exchangeFacebookToken(searchParams.code)
            // Clear the code from URL
            redirect('/admin/social')
        } catch (err: any) {
            return (
                <div className="p-8 text-red-500">
                    <h1>Connection Failed</h1>
                    <p>{err.message || 'Unknown error'}</p>
                    <a href="/admin/social" className="underline">Try Again</a>
                </div>
            )
        }
    }

    if (searchParams.error) {
        return (
            <div className="p-8 text-red-500">
                <h1>Authorization Denied</h1>
                <p>{searchParams.error}</p>
                <a href="/admin/social" className="underline">Back</a>
            </div>
        )
    }

    // Fetch connected accounts
    const { data: accounts } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    const userAccount = accounts?.find(a => a.account_type === 'user')
    const pages = accounts?.filter(a => a.account_type === 'page') || []

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Social Connections</h1>

                {!userAccount ? (
                    <form action={async () => {
                        'use server'
                        const url = await getFacebookAuthUrl()
                        redirect(url)
                    }}>
                        <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium">
                            Connect Facebook
                        </button>
                    </form>
                ) : (
                    <div className="flex items-center gap-2 text-green-600 font-medium">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Connected as {userAccount.name}
                    </div>
                )}
            </div>

            <div className="grid gap-6">
                <div className="border rounded-xl bg-white shadow-sm overflow-hidden text-slate-900">
                    <div className="px-6 py-4 border-b bg-slate-50">
                        <h3 className="font-semibold text-lg">Managed Pages</h3>
                    </div>
                    <div className="p-6">
                        {pages.length === 0 ? (
                            <p className="text-gray-500 italic">No pages found. Connect your account to import pages you manage.</p>
                        ) : (
                            <div className="space-y-4">
                                {pages.map(page => (
                                    <div key={page.id} className="border p-4 rounded-lg space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                {page.image_url && <img src={page.image_url} alt={page.name} className="w-10 h-10 rounded-full" />}
                                                <div>
                                                    <p className="font-bold">{page.name}</p>
                                                    <p className="text-xs text-gray-500">ID: {page.provider_id}</p>
                                                </div>
                                            </div>
                                            <PostForm accountId={page.id} />
                                        </div>

                                        <div className="pt-2 border-t">
                                            <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Recent Posts Preview</h4>
                                            <Suspense fallback={<div className="p-4 text-xs">Loading feed...</div>}>
                                                <FacebookFeed accountId={page.id} />
                                            </Suspense>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function PostForm({ accountId }: { accountId: string }) {
    return (
        <form
            action={async (formData) => {
                'use server'
                const message = formData.get('message') as string
                if (!message) return
                await publishToFacebook(accountId, message)
                redirect('/admin/social') // Refresh
            }}
            className="flex gap-2"
        >
            <input
                name="message"
                placeholder="Write a post..."
                className="border rounded px-3 py-2 text-sm w-64"
                required
            />
            <button type="submit" className="px-3 py-2 border rounded hover:bg-slate-100 text-sm font-medium">
                Post
            </button>
        </form>
    )
}
