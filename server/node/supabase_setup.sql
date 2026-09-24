-- ============================================================
-- Supabase SQL Setup for OmniQuery
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'pro', 'admin')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index on email for fast lookups during login
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- 2. Blacklisted tokens table (for logout / session invalidation)
CREATE TABLE IF NOT EXISTS blacklisted_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index on token for fast blacklist checks in middleware
CREATE INDEX IF NOT EXISTS idx_blacklisted_tokens_token ON blacklisted_tokens (token);

-- 3. Auto-cleanup: delete expired blacklisted tokens
--    Supabase supports pg_cron via the Dashboard (Extensions → pg_cron).
--    After enabling pg_cron, run this to schedule hourly cleanup:
--
--    SELECT cron.schedule(
--        'cleanup-blacklisted-tokens',
--        '0 * * * *',
--        $$ DELETE FROM blacklisted_tokens WHERE expires_at < now() $$
--    );
