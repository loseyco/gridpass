'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET
// Fallback for local development, should be configured in env
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const REDIRECT_URI = `${APP_URL}/admin/social`

export async function getFacebookAuthUrl() {
    if (!FACEBOOK_APP_ID) throw new Error('Missing Facebook App ID')

    const scopes = [
        'public_profile',
        'pages_show_list',
        'pages_read_engagement',
        'pages_manage_posts'
    ].join(',')

    const params = new URLSearchParams({
        client_id: FACEBOOK_APP_ID,
        redirect_uri: REDIRECT_URI,
        scope: scopes,
        response_type: 'code',
        state: 'facebook_connect' // Simple state for now
    })

    return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`
}

export async function exchangeFacebookToken(code: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // 1. Exchange Code for Access Token
    const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?` + new URLSearchParams({
        client_id: FACEBOOK_APP_ID!,
        client_secret: FACEBOOK_APP_SECRET!,
        redirect_uri: REDIRECT_URI,
        code: code
    })

    const tokenRes = await fetch(tokenUrl)
    const tokenData = await tokenRes.json()

    if (tokenData.error) {
        throw new Error(`Facebook Auth Error: ${tokenData.error.message}`)
    }

    const shortLivedToken = tokenData.access_token

    // 2. Exchange for Long-Lived Token (60 days)
    const longLivedUrl = `https://graph.facebook.com/v19.0/oauth/access_token?` + new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: FACEBOOK_APP_ID!,
        client_secret: FACEBOOK_APP_SECRET!,
        fb_exchange_token: shortLivedToken
    })

    const longLivedRes = await fetch(longLivedUrl)
    const longLivedData = await longLivedRes.json()
    const accessToken = longLivedData.access_token || shortLivedToken

    // 3. Get User Profile (to identify the connection)
    const meUrl = `https://graph.facebook.com/me?fields=id,name,picture&access_token=${accessToken}`
    const meRes = await fetch(meUrl)
    const meData = await meRes.json()

    // 4. Save "User" connection to DB
    const { error: saveError } = await supabase.from('social_accounts').upsert({
        user_id: user.id,
        provider: 'facebook',
        provider_id: meData.id,
        access_token: accessToken,
        name: meData.name,
        image_url: meData.picture?.data?.url,
        account_type: 'user',
        updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,provider,provider_id' })

    if (saveError) {
        console.error('DB Config Error:', saveError)
        throw new Error('Failed to save connection')
    }

    // 5. Automatically fetch and save Pages this user manages
    await syncManagedPages(accessToken, user.id)

    return { success: true }
}

async function syncManagedPages(userAccessToken: string, userId: string) {
    const supabase = await createClient()

    // Fetch pages
    const pagesUrl = `https://graph.facebook.com/me/accounts?access_token=${userAccessToken}`
    const res = await fetch(pagesUrl)
    const data = await res.json()

    if (data.data) {
        for (const page of data.data) {
            // Check if we have publish permission
            const canPublish = page.tasks?.includes('CREATE_CONTENT') || page.perms?.includes('CREATE_CONTENT')

            // We save the PAGE'S access token, not the user's
            // This allows us to post AS THE PAGE later without user intervention
            await supabase.from('social_accounts').upsert({
                user_id: userId,
                provider: 'facebook',
                provider_id: page.id,
                access_token: page.access_token, // Page-specific token
                name: page.name,
                image_url: `https://graph.facebook.com/${page.id}/picture`,
                account_type: 'page',
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,provider,provider_id' })
        }
    }
}

// Publish simple text post
export async function publishToFacebook(accountId: string, message: string) {
    const supabase = await createClient()

    // Get the page's token from our DB
    const { data: account } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('id', accountId)
        .single()

    if (!account) throw new Error('Account not found')

    const url = `https://graph.facebook.com/${account.provider_id}/feed`
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: message,
            access_token: account.access_token
        })
    })

    const result = await res.json()
    if (result.error) throw new Error(result.error.message)

    return result
}

export async function getFacebookPosts(accountId: string) {
    const supabase = await createClient()

    const { data: account } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('id', accountId)
        .single()

    if (!account) return []

    // Fetch feed with fields we need
    const url = `https://graph.facebook.com/${account.provider_id}/feed?fields=id,message,created_time,full_picture,permalink_url&limit=5&access_token=${account.access_token}`

    try {
        const res = await fetch(url, { next: { revalidate: 60 } }) // Cache for 60s
        const data = await res.json()

        if (data.error) {
            console.error('FB Fetch Error:', data.error)
            return []
        }

        return data.data || []
    } catch (e) {
        console.error('FB Network Error:', e)
        return []
    }
}
