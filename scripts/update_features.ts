import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const features = [
    // LIVE / COMPLETED
    {
        title: 'Resume Builder & Shadow Profiles',
        description: 'Create professional racing resumes that automatically generate a public profile visible in the Members Directory. Unclaimed profiles are created as leads.',
        category: 'Career',
        status: 'completed',
        priority: 'high',
        votes: 50 // Seed with some votes to show popularity
    },
    {
        title: 'Members Directory',
        description: 'Browse and search verified drivers, mechanics, racing teams, and discover new talent in the community.',
        category: 'Community',
        status: 'completed',
        priority: 'high',
        votes: 45
    },
    {
        title: 'Industry Network',
        description: 'Comprehensive directory of race tracks, shops, teams, and industry experts with advanced filtering capabilities.',
        category: 'Network',
        status: 'completed',
        priority: 'medium',
        votes: 40
    },
    {
        title: 'Virtual Garage',
        description: 'Manage your race vehicles, track engine hours, catalog tools & gear, and showcase your setup.',
        category: 'Tools',
        status: 'completed',
        priority: 'medium',
        votes: 35
    },
    {
        title: 'Service Inquiry Dashboard',
        description: 'Professional dashboard for service providers to manage incoming inquiries, leads, and client communications.',
        category: 'Business',
        status: 'completed',
        priority: 'high',
        votes: 30
    },
    {
        title: 'Classifieds Messaging',
        description: 'Secure internal messaging system for classified listings, allowing buyers and sellers to communicate directly on platform.',
        category: 'Marketplace',
        status: 'completed',
        priority: 'medium',
        votes: 25
    },
    {
        title: 'Social Events (GridPass After Dark)',
        description: 'Discover and host racing meetups, social events, and networking opportunities in your area.',
        category: 'Community',
        status: 'completed',
        priority: 'low',
        votes: 20
    },

    // PLANNED / IN PROGRESS
    {
        title: 'Arrive & Drive Matchmaking',
        description: 'Automated matching system for drivers looking for seats and teams looking for funded drivers for specific events.',
        category: 'Racing',
        status: 'planned',
        priority: 'high',
        votes: 120 // Highly requested
    },
    {
        title: 'Public API Access',
        description: 'Developer API to access GridPass data programmatically and integrate with third-party tools and dashboards.',
        category: 'Developer',
        status: 'planned',
        priority: 'medium',
        votes: 85
    },
    {
        title: 'Mobile App',
        description: 'Native iOS and Android application for on-the-go access to messages, notifications, and quick profile updates.',
        category: 'Platform',
        status: 'planned',
        priority: 'high',
        votes: 150
    },
    {
        title: 'Payments & Invoicing',
        description: 'Integrated Stripe payments allowing service providers to invoice clients and receive payments directly through GridPass.',
        category: 'Business',
        status: 'planned',
        priority: 'high',
        votes: 95
    },
    {
        title: 'Team Roster Management',
        description: 'Advanced tools for team owners to manage driver lineups, crew assignments, and logistics for race weekends.',
        category: 'Teams',
        status: 'planned',
        priority: 'medium',
        votes: 60
    }
];

async function seedFeatures() {
    console.log('Seeding features...');

    for (const feature of features) {
        // Check if exists by title to avoid duplicates (could use upsert on title if unique, but ID is usually PK)
        const { data: existing } = await supabase
            .from('features')
            .select('id')
            .eq('title', feature.title)
            .single();

        if (existing) {
            console.log(`Updating feature: ${feature.title}`);
            const { error } = await supabase
                .from('features')
                .update({
                    description: feature.description,
                    category: feature.category,
                    status: feature.status,
                    priority: feature.priority,
                    // Don't overwrite votes if existing to preserve user input mostly, 
                    // but for this seed we might want to ensure baseline votes for demo.
                    // Let's only update votes if the existing vote count is 0 or null?
                    // Actually, for simplicity, let's just update everything EXCEPT votes if it exists to respect user engagement.
                    // Wait, request was "update with real features", implying a reset or source of truth update.
                    // I'll update description/status/category always.
                })
                .eq('id', existing.id);

            if (error) console.error(`Error updating ${feature.title}:`, error);
        } else {
            console.log(`Creating feature: ${feature.title}`);
            const { error } = await supabase
                .from('features')
                .insert(feature);

            if (error) console.error(`Error inserting ${feature.title}:`, error);
        }
    }

    console.log('Feature seeding complete.');
}

seedFeatures().catch(console.error);
