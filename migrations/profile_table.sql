CREATE EXTENSION IF NOT EXISTS pg_uuidv7;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profile (
                                        profile_id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
                                        profile_username VARCHAR(20) NOT NULL,
                                        profile_email VARCHAR(255) NOT NULL,
                                        profile_password_hash TEXT NOT NULL,
                                        profile_created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username ON profile(profile_username);
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email ON profile(profile_email);

-- Create index on created_at for analytics
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profile(profile_created_at DESC);

-- Add constraints
ALTER TABLE profile
    ADD CONSTRAINT chk_username_length CHECK (LENGTH(profile_username) >= 3 AND LENGTH(profile_username) <= 20);

-- Add comments
COMMENT ON TABLE profile IS 'User profiles with authentication credentials';
COMMENT ON COLUMN profile.profile_id IS 'UUID v7 primary key';
COMMENT ON COLUMN profile.profile_username IS 'Unique username (3-20 chars, used for @mentions)';
COMMENT ON COLUMN profile.profile_email IS 'Unique email address for signin';
COMMENT ON COLUMN profile.profile_password_hash IS 'Argon2 password hash (never exposed in API)';
