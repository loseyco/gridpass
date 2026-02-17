DO $$
BEGIN
    -- Check if table exists first (safeguard)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'os_stewards_incidents') THEN
        
        -- Add notification_count if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'os_stewards_incidents' AND column_name = 'notification_count') THEN
            ALTER TABLE os_stewards_incidents ADD COLUMN notification_count INTEGER DEFAULT 0;
        END IF;

        -- Add last_notification_sent_at if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'os_stewards_incidents' AND column_name = 'last_notification_sent_at') THEN
            ALTER TABLE os_stewards_incidents ADD COLUMN last_notification_sent_at TIMESTAMPTZ;
        END IF;

    END IF;
END $$;
