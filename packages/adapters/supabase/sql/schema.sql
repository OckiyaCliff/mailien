-- ──────────────────────────────────────────────
-- Mailien — Supabase Schema
-- ──────────────────────────────────────────────
-- Run this in the Supabase SQL Editor to set up
-- all tables required by @mailien/supabase-adapter.
-- ──────────────────────────────────────────────

-- ─── Enums ───────────────────────────────────

CREATE TYPE message_direction AS ENUM ('inbound', 'outbound');
CREATE TYPE message_status AS ENUM ('queued', 'sent', 'delivered', 'opened', 'bounced', 'complained', 'failed');

-- ─── Tables ──────────────────────────────────

CREATE TABLE IF NOT EXISTS mailboxes (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email       TEXT NOT NULL UNIQUE,
    name        TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS threads (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    mailbox_id      TEXT NOT NULL REFERENCES mailboxes(id) ON DELETE CASCADE,
    subject         TEXT NOT NULL,
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    message_count   INT NOT NULL DEFAULT 0,
    is_read         BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_threads_mailbox ON threads(mailbox_id);
CREATE INDEX idx_threads_last_message ON threads(last_message_at DESC);

CREATE TABLE IF NOT EXISTS messages (
    id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    thread_id         TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    email_message_id  TEXT NOT NULL UNIQUE,
    resend_id         TEXT UNIQUE,
    "from"            TEXT NOT NULL,
    "to"              TEXT[] NOT NULL DEFAULT '{}',
    cc                TEXT[] NOT NULL DEFAULT '{}',
    bcc               TEXT[] NOT NULL DEFAULT '{}',
    subject           TEXT,
    body_html         TEXT,
    body_text         TEXT,
    direction         message_direction NOT NULL,
    status            message_status NOT NULL DEFAULT 'queued',
    in_reply_to       TEXT,
    "references"      TEXT[] NOT NULL DEFAULT '{}',
    headers           JSONB,
    sent_at           TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_thread ON messages(thread_id);
CREATE INDEX idx_messages_resend ON messages(resend_id);

CREATE TABLE IF NOT EXISTS attachments (
    id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    message_id    TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    filename      TEXT NOT NULL,
    content_type  TEXT NOT NULL,
    size          INT NOT NULL,
    url           TEXT
);

CREATE INDEX idx_attachments_message ON attachments(message_id);

-- ─── Row Level Security ──────────────────────
-- Enable RLS on all tables. Adjust policies to
-- match your auth strategy.

ALTER TABLE mailboxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads   ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages  ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- Default: Allow authenticated users full access.
-- In production, scope these to specific mailbox ownership.

CREATE POLICY "Authenticated users can read mailboxes"
    ON mailboxes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert mailboxes"
    ON mailboxes FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can read threads"
    ON threads FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert threads"
    ON threads FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update threads"
    ON threads FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read messages"
    ON messages FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert messages"
    ON messages FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update messages"
    ON messages FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read attachments"
    ON attachments FOR SELECT TO authenticated USING (true);

-- ─── Auto-update updated_at ──────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_mailboxes_updated_at
    BEFORE UPDATE ON mailboxes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_threads_updated_at
    BEFORE UPDATE ON threads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
