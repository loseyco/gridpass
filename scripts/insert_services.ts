
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('Fetching users...');
    // 1. Get User ID
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
        console.error('Error fetching users:', userError);
        return;
    }

    console.log('Total users found:', users.length);
    users.forEach(u => console.log(`User: ${u.id}, Email: ${u.email}, Metadata:`, JSON.stringify(u.user_metadata)));

    // Try to find by metadata username OR email
    const user = users.find(u =>
        (u.user_metadata?.username && u.user_metadata.username.toLowerCase() === 'pjlosey') ||
        (u.email && u.email.includes('pjlosey'))
    );

    if (!user) {
        console.error('User pjlosey not found');
        return;
    }

    console.log(`Found target user: ${user.id} (${user.email})`);

    // 2. Define Services
    const services = [
        {
            user_id: user.id,
            title: 'Website Building & Modernization',
            description: 'Custom websites for race shops and teams. Modern design, mobile responsive, and SEO optimized to help you attract more sponsors and customers.',
            price: 1500.00,
            currency: 'USD',
            unit: 'project',
            category: 'Engineering',
            tags: ['Web Design', 'SEO', 'React', 'Next.js'],
            is_active: true,
            photo_url: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=2069&auto=format&fit=crop'
        },
        {
            user_id: user.id,
            title: 'Custom Shop Management Suite',
            description: 'Bespoke software solutions for inventory, scheduling, and customer management. Built tailored to your specific workflow needs.',
            price: 2000.00,
            currency: 'USD',
            unit: 'project',
            category: 'Engineering',
            tags: ['Software', 'Inventory', 'CRM', 'Workflow'],
            is_active: true,
            photo_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop'
        },
        {
            user_id: user.id,
            title: 'Workshop Workflow Optimization',
            description: 'Physical shop reorganization for maximum workflow efficiency and professional appearance. Lean manufacturing principles applied to race shops.',
            price: 1000.00,
            currency: 'USD',
            unit: 'project',
            category: 'Mechanic',
            tags: ['Shop Layout', 'Efficiency', 'Organization', 'Lean'],
            is_active: true,
            photo_url: 'https://images.unsplash.com/photo-1581092921461-eab624960965?q=80&w=2070&auto=format&fit=crop'
        },
        {
            user_id: user.id,
            title: 'Shop Management System Integration',
            description: 'Expert setup and migration to modern shop management platforms (e.g., Shop Monkey) to digitize your business immediately.',
            price: 500.00,
            currency: 'USD',
            unit: 'project',
            category: 'Data',
            tags: ['Shop Monkey', 'Migration', 'Setup', 'Training'],
            is_active: true,
            photo_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop'
        },
        // Keeping "Fly In DAG" / Race Engineering as it's core to the profile identity
        {
            user_id: user.id,
            title: 'Race Engineering & Strategy',
            description: 'Full race weekend engineering support, including strategy, setup optimization, and performance analysis.',
            price: 1200.00,
            currency: 'USD',
            unit: 'daily',
            category: 'Engineering',
            tags: ['Race Strategy', 'Setup', 'Performance Engineering', 'Trackside'],
            is_active: true,
            photo_url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=2070&auto=format&fit=crop'
        }
    ];

    // 3. Clear existing services to prevent duplicates (optional, based on title)
    const titles = services.map(s => s.title);
    const { error: deleteError } = await supabase.from('user_services').delete().eq('user_id', user.id).in('title', titles);
    if (deleteError) console.error('Delete error:', deleteError);

    // 4. Insert Services
    const { data, error } = await supabase.from('user_services').insert(services).select();

    if (error) {
        console.error('Error inserting services:', error);
    } else {
        console.log('Successfully inserted services:', data.length);
    }
}

main();
