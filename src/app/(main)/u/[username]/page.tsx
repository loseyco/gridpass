import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { notFound } from 'next/navigation'
import PublicProfileClient from './PublicProfileClient'
import { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface PageProps {
    params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { username } = await params;
    const supabase = await createClient();

    const { data: profile } = await supabase
        .from('os_user_profiles')
        .select('id, username, first_name, last_name, bio, avatar_url')
        .ilike('username', username)
        .single();

    if (!profile) {
        return {
            title: 'Profile Not Found | GridPass'
        };
    }

    // Construct display name
    const fullName = profile.first_name && profile.last_name
        ? `${profile.first_name} ${profile.last_name}`
        : (profile.first_name || profile.username);

    const { data: services } = await supabase
        .from('user_services')
        .select('title')
        .eq('user_id', profile.id)
        .eq('is_active', true);

    const serviceTitles = services?.map(s => s.title).join(', ');
    const serviceText = serviceTitles ? ` | Services: ${serviceTitles}` : '';

    const title = `${fullName} (@${profile.username}) | GridPass${serviceText}`;
    const description = (profile.bio || `Check out ${profile.username}'s profile on GridPass.`) + serviceText;

    // Construct valid OG images
    const images: string[] = [];

    if (profile.avatar_url) {
        // Try to transform Supabase storage images to JPEG
        // This handles HEIC images which are not supported by most social crawlers
        if (profile.avatar_url.includes('supabase.co/storage/v1/object/public')) {
            const renderedUrl = profile.avatar_url.replace(
                '/storage/v1/object/public',
                '/storage/v1/render/image/public'
            );
            // Append transformation params
            images.push(`${renderedUrl}?width=1200&height=630&resize=cover&format=jpeg`);
        }

        // Include original avatar URL as backup
        images.push(profile.avatar_url);
    }

    // Always include the generic fallback
    // Note: /hero-launch.png appears to be specific to the founder (pjlosey)
    // using generic fallback for others
    images.push('/hero-launch-generic.png');

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images,
        }
    };
}

export default async function PublicProfilePage({ params }: PageProps) {
    const { username } = await params
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch profile
    const { data: profile } = await supabase
        .from('os_user_profiles')
        .select('*')
        .ilike('username', username)
        .single()

    if (!profile) {
        notFound()
    }

    // Check if viewing own profile
    const isOwner = user?.id === profile.id

    // Fetch Work History (replacing career_history JSON)
    const { data: workHistory } = await supabase
        .from('os_user_work_history')
        .select('*')
        .eq('user_id', profile.id)
        .order('start_date', { ascending: false })

    // Fetch Skills (replacing skills array)
    const { data: userSkills } = await supabase
        .from('os_user_skills')
        .select('skill')
        .eq('user_id', profile.id)

    const skills = userSkills?.map(s => s.skill) || []

    // Construct full name for display where needed
    const fullName = profile.first_name && profile.last_name
        ? `${profile.first_name} ${profile.last_name}`
        : (profile.first_name || profile.username);

    // Merge legacy fields for UI compatibility
    const uiProfile = {
        ...profile,
        full_name: fullName,
        role: profile.target_role, // Map target_role to role
        career_history: workHistory // Map workHistory to career_history (if Client expects it, or pass separately)
    }

    const { data: mediaItems } = await supabase
        .from('profile_media')
        .select('*')
        .eq('user_id', profile.id)
        .order('sort_order', { ascending: true })

    // Fetch services
    const { data: services } = await supabase
        .from('user_services')
        .select('*')
        .eq('user_id', profile.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

    // Fetch recommendations 
    // Use admin client to ensure we get them even if RLS is strict for non-owners
    // NOTE: Column name is `target_user_id` not `to_user_id`
    // NOTE: Relation name is `author_id` (aliased to `from_profile` for compatibility)
    const { data: recommendations } = await adminSupabase
        .from('recommendations')
        .select(`
            *,
            from_profile:author_id (
                id,
                username,
                full_name,
                avatar_url
            )
        `)
        .eq('target_user_id', profile.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })

    // Check verification status
    const isVerified = profile.target_role === 'verified' || profile.target_role === 'founder' || profile.target_role === 'superadmin'

    // Fetch public vehicles and collections using ADMIN client to bypass RLS
    // TEMPORARILY DISABLED per user request: "drop the cars and collections from the u/pjlosey page"
    /*
    const { data: collections } = await adminSupabase
        .from('collections')
        .select('*')
        .eq('owner_id', profile.id)
        .eq('visibility', 'Public')
        .order('created_at', { ascending: false })

    const publicCollectionIds = collections?.map((c: any) => c.id) || []

    // Filter collections for display list
    // Exclude default and "Personal Collection" by name/logic
    const displayCollections = collections?.filter((c: any) =>
        !c.is_default &&
        !c.name.includes('Personal Collection') &&
        c.name !== 'My Collection' // covering common defaults
    ) || []

    // Store active vehicles logic can be handled by status if needed, but 'is_active' column seems missing or unreliable.
    const { data: publicVehicles } = await adminSupabase
        .from('user_vehicles')
        .select('*, collection:collections(id, name, visibility)')
        .eq('user_id', profile.id)

    const visibleVehicles = publicVehicles?.filter((v: any) => {
        // Show if no collection (orphan) OR collection is explicitly Public
        const isOrphan = !v.collection
        const isPublicCollection = v.collection?.visibility === 'Public'
        // If collection is not loaded in relation (e.g. deleted), treat as orphan? 
        // Or if it IS in a collection but that collection is NOT in our public list?
        // Let's use the ID check for safety if joined data is missing.
        const isInPublicList = v.collection_id && publicCollectionIds.includes(v.collection_id)

        // Also, if the collection is the DEFAULT collection (which we filtered out of the list), we SHOULD show the cars if user wants them.
        // But the default collection found in debug was Private.
        // If user wants those cars, we need to allow them.
        // Let's just blindly trust "publicVehicles" fetch (which is ALL vehicles for user now)
        // and only filter if they are in a PRIVATE, NON-DEFAULT collection?
        // Or simpler: Show all vehicles that are NOT in a private collection.
        // We know which collections are public (collections array).
        // If v.collection.visibility is 'Private' AND it's not the default one?
        // Actually, user said "showing cars from our personal the one that defaults to the user".
        // This implies cars in default collection SHOULD be visible.
        // So:
        // 1. Is orphan? YES.
        // 2. Is in Public collection? YES.
        // 3. Is in Default collection? YES (even if private).

        const isDefaultCollection = v.collection?.is_default
        // Check if collection name looks like personal?
        const isPersonalCollection = v.collection?.name?.includes('Personal Collection')

        return isOrphan || isPublicCollection || isInPublicList || isDefaultCollection || isPersonalCollection
    }) || []
    */

    // Passing empty arrays to hide sections
    const displayCollections: any[] = []
    const visibleVehicles: any[] = []

    // Fetch owned organizations (if owner)
    let ownedOrgs: any[] = []
    if (isOwner && user) {
        const { data: orgs } = await supabase
            .from('organizations')
            .select('*')
            .eq('claimed_by', user.id)
            .order('created_at', { ascending: false })

        ownedOrgs = orgs || []
    }

    return (
        <PublicProfileClient
            profile={uiProfile}
            isVerified={isVerified}
            isOwner={isOwner}
            career={workHistory || []}
            skills={skills}
            mediaItems={mediaItems || []}
            recommendations={recommendations || []}
            vehicles={visibleVehicles}
            collections={displayCollections}
            ownedOrgs={ownedOrgs}
            services={services || []}
        />
    )
}
