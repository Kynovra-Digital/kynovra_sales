-- Add is_banned column to profiles for client account management
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT false;

-- Add index for faster banned user lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON profiles(is_banned) WHERE is_banned = true;

-- Add comment for documentation
COMMENT ON COLUMN profiles.is_banned IS 'If true, the user cannot log in to the platform';