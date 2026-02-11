-- Seed Collection Management Service for PJ
DO $$
DECLARE
    v_user_id uuid;
BEGIN
    SELECT id INTO v_user_id FROM profiles WHERE username = 'pjlosey';

    IF v_user_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM user_services WHERE user_id = v_user_id AND title = 'Collection Management') THEN
            INSERT INTO user_services (user_id, title, description, price, unit, category, tags, is_active) 
            VALUES (v_user_id, 'Collection Management', 'Full-service management for your automotive collection. Logistics, maintenance tracking, acquisition support, and digital documentation.', 2500, 'monthly', 'Management', ARRAY['Management', 'Logistics', 'Consulting'], true);
        END IF;
    END IF;
END $$;
