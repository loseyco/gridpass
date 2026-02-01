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

-- Revoke public access to prevent abuse (Only Service Role or Triggers should call this)
REVOKE EXECUTE ON FUNCTION award_points FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION award_points FROM anon;
REVOKE EXECUTE ON FUNCTION award_points FROM authenticated;

-- Trigger Function for Signup Bonus
CREATE OR REPLACE FUNCTION award_signup_bonus()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Award 100 points for joining (Early Adopter / Signup Bonus)
    PERFORM award_points(NEW.id, 100, 'signup_bonus');
    RETURN NEW;
END;
$$;

-- Trigger for Signup Bonus
DROP TRIGGER IF EXISTS signup_bonus_trigger ON profiles;

CREATE TRIGGER signup_bonus_trigger
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION award_signup_bonus();
