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

-- ============================================================
-- Chat Storage Tables
-- ============================================================

-- 4. Conversations table (each chat session)
CREATE TABLE IF NOT EXISTS conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Chat',
    source TEXT DEFAULT 'website' CHECK (source IN ('website', 'youtube', 'document')),
    source_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations (user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations (updated_at DESC);

-- 5. Messages table (individual messages within a conversation)
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'error')),
    content TEXT NOT NULL,
    follow_ups JSONB DEFAULT '[]'::jsonb,
    source TEXT,
    url TEXT,
    file_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast message retrieval within a conversation
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (conversation_id, created_at ASC);
