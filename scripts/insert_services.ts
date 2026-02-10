
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
            title: 'Race Engineering & Strategy',
            description: 'Full race weekend engineering support, including strategy, setup optimization, and performance analysis. Experienced in IMSA, SRO, and IndyCar paddocks.',
            price: 1200.00,
            currency: 'USD',
            unit: 'daily',
            category: 'Engineering',
            tags: ['Race Strategy', 'Setup', 'Performance Engineering', 'Trackside'],
            is_active: true,
            photo_url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=2070&auto=format&fit=crop'
        },
        {
            user_id: user.id,
            title: 'Data Analysis & Telemetry',
            description: 'In-depth data analysis using Motec i2, McLaren Atlas, or Pi Toolbox. Driver coaching through data, vehicle health monitoring, and system performance evaluation.',
            price: 150.00,
            currency: 'USD',
            unit: 'hourly',
            category: 'Coaching',
            tags: ['Motec', 'Data Analysis', 'Driver Coaching', 'Telemetry'],
            is_active: true,
            photo_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop'
        },
        {
            user_id: user.id,
            title: 'Wiring & Electronics Integration',
            description: 'Custom wiring harness design and build, ECU/PDM configuration, and sensor integration. Certified MECP installer with experience in complex motorsport electronics.',
            price: 100.00,
            currency: 'USD',
            unit: 'hourly',
            category: 'Mechanic',
            tags: ['Wiring', 'Electronics', 'ECU Tuning', 'PDM'],
            is_active: true,
            photo_url: 'https://images.unsplash.com/photo-1581092921461-eab624960965?q=80&w=2070&auto=format&fit=crop'
        },
        {
            user_id: user.id,
            title: 'Custom Software Solutions',
            description: 'Bespoke software development for race teams. Strategy tools, inventory management, or custom dashboards using React, Node.js, and Supabase.',
            price: 5000.00,
            currency: 'USD',
            unit: 'project',
            category: 'Other',
            tags: ['Software Development', 'Web Apps', 'Tooling', 'React'],
            is_active: true,
            photo_url: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=2069&auto=format&fit=crop'
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
