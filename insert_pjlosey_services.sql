-- Insert services for pjlosey
-- User ID will be fetched
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    SELECT id INTO target_user_id FROM auth.users WHERE raw_user_meta_data->>'username' = 'pjlosey';

    IF target_user_id IS NOT NULL THEN
        INSERT INTO public.user_services (user_id, title, description, price, currency, unit, category, tags, is_active, photo_url)
        VALUES
        (
            target_user_id,
            'Race Engineering & Strategy',
            'Full race weekend engineering support, including strategy, setup optimization, and performance analysis. Experienced in IMSA, SRO, and IndyCar paddocks.',
            1200.00,
            'USD',
            'daily',
            'Engineering',
            ARRAY['Race Strategy', 'Setup', 'Performance Engineering', 'Trackside'],
            true,
            'https://pjlosey.com/images/services/race-engineering.jpg' -- Placeholder, user can update
        ),
        (
            target_user_id,
            'Data Analysis & Telemetry',
            'In-depth data analysis using Motec i2, McLaren Atlas, or Pi Toolbox. Driver coaching through data, vehicle health monitoring, and system performance evaluation.',
            150.00,
            'USD',
            'hourly',
            'Coaching',
            ARRAY['Motec', 'Data Analysis', 'Driver Coaching', 'Telemetry'],
            true,
            'https://pjlosey.com/images/services/data-analysis.jpg'
        ),
        (
            target_user_id,
            'Wiring & Electronics Integration',
            'Custom wiring harness design and build, ECU/PDM configuration, and sensor integration. Certified MECP installer with experience in complex motorsport electronics.',
            100.00,
            'USD',
            'hourly',
            'Mechanic',
            ARRAY['Wiring', 'Electronics', 'ECU Tuning', 'PDM'],
            true,
            'https://pjlosey.com/images/services/electronics.jpg'
        ),
        (
            target_user_id,
            'Custom Software Solutions',
            'Bespoke software development for race teams. Strategy tools, inventory management, or custom dashboards using React, Node.js, and Supabase.',
            5000.00,
            'USD',
            'project',
            'Other',
            ARRAY['Software Development', 'Web Apps', 'Tooling', 'React'],
            true,
            'https://pjlosey.com/images/services/software.jpg'
        );
    END IF;
END $$;
