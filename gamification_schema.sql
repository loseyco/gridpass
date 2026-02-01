-- Add points column to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- Create point_transactions table
CREATE TABLE IF NOT EXISTS point_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL, -- e.g., 'signup_bonus', 'recommendation_given'
    metadata JSONB DEFAULT '{}'::jsonb, -- Store related IDs (e.g., recommendation_id)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for point_transactions
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view their own point transactions" 
ON point_transactions FOR SELECT 
USING (auth.uid() = user_id);

-- Only system (via functions) or admin can insert
-- We'll rely on SECURITY DEFINER functions for awarding points to ensure integrity
-- or Service Role usage in Actions.

-- Function to award points (callable by system)
CREATE OR REPLACE FUNCTION award_points(
    target_user_id UUID, 
    points_amount INTEGER, 
    reason_text TEXT, 
    meta JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert transaction
    INSERT INTO point_transactions (user_id, amount, reason, metadata)
    VALUES (target_user_id, points_amount, reason_text, meta);

    -- Update profile total
    UPDATE profiles
    SET points = points + points_amount
    WHERE id = target_user_id;
END;
$$;
