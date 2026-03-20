-- ============================================
-- COCO GAMES - Migration V2: Admin System
-- Run this in the Supabase SQL Editor AFTER v1
-- ============================================

-- ============================================
-- ADD ROLE COLUMN TO USERS
-- ============================================
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';

-- Migrate existing owners
UPDATE public.users SET role = 'owner' WHERE is_owner = true AND role = 'user';

-- ============================================
-- TICKETS TABLE
-- Support tickets created by users
-- ============================================
CREATE TABLE public.tickets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_discord_id text NOT NULL,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'closed')),
  priority text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  closed_at timestamptz
);

CREATE INDEX idx_tickets_user ON public.tickets (user_discord_id);
CREATE INDEX idx_tickets_status ON public.tickets (status);
CREATE INDEX idx_tickets_assigned ON public.tickets (assigned_to);

-- ============================================
-- TICKET MESSAGES TABLE
-- Chat messages within a ticket
-- ============================================
CREATE TABLE public.ticket_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id uuid NOT NULL REFERENCES public.tickets (id) ON DELETE CASCADE,
  author_discord_id text NOT NULL,
  content text NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_ticket_messages_ticket ON public.ticket_messages (ticket_id);

-- ============================================
-- DISCIPLINE LOG TABLE
-- Tracks bans, kicks, warnings across servers
-- ============================================
CREATE TABLE public.discipline_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  target_discord_id text NOT NULL,
  guild_id text,
  guild_name text,
  action_type text NOT NULL
    CHECK (action_type IN ('ban', 'unban', 'kick', 'warn', 'note')),
  reason text,
  moderator_discord_id text,
  moderator_username text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_discipline_target ON public.discipline_log (target_discord_id);
CREATE INDEX idx_discipline_guild ON public.discipline_log (guild_id);
CREATE INDEX idx_discipline_type ON public.discipline_log (action_type);

-- ============================================
-- ANNOUNCEMENTS TABLE
-- History of sent announcements
-- ============================================
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_discord_id text NOT NULL,
  content text NOT NULL,
  guild_ids text[] NOT NULL DEFAULT '{}',
  sent_at timestamptz DEFAULT now()
);

-- ============================================
-- ADD ANNOUNCEMENT CHANNEL TO GUILD CONFIGS
-- ============================================
ALTER TABLE public.guild_configs
  ADD COLUMN IF NOT EXISTS announcement_channel text;

-- ============================================
-- ROW LEVEL SECURITY ON NEW TABLES
-- ============================================
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discipline_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- ============================================
-- AUTO-UPDATE TRIGGERS FOR NEW TABLES
-- ============================================
CREATE TRIGGER tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
