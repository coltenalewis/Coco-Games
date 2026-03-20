-- ============================================
-- COCO GAMES - Supabase Database Setup
-- Run this in the Supabase SQL Editor
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- USERS TABLE
-- Stores linked Discord/Roblox accounts
-- ============================================
create table public.users (
  id uuid primary key default uuid_generate_v4(),
  discord_id text unique not null,
  discord_username text not null,
  discord_avatar text,
  roblox_id text unique,
  roblox_username text,
  is_owner boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for fast Discord ID lookups
create index idx_users_discord_id on public.users (discord_id);

-- ============================================
-- GUILD CONFIGS TABLE
-- Stores per-server bot configuration
-- ============================================
create table public.guild_configs (
  id uuid primary key default uuid_generate_v4(),
  guild_id text unique not null,
  welcome_enabled boolean default false,
  welcome_channel text,
  welcome_message text default 'Welcome to the server, {user}!',
  auto_roles text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for fast guild ID lookups
create index idx_guild_configs_guild_id on public.guild_configs (guild_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.guild_configs enable row level security;

-- Users: only the service role can read/write (all access goes through our API)
-- No public access policies = locked down by default with RLS enabled.
-- The service_role key bypasses RLS, which is what our server-side code uses.

-- If you ever need anon/authenticated access, add policies like:
-- create policy "Users can read their own data" on public.users
--   for select using (auth.uid()::text = id::text);

-- ============================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

create trigger users_updated_at
  before update on public.users
  for each row execute function public.handle_updated_at();

create trigger guild_configs_updated_at
  before update on public.guild_configs
  for each row execute function public.handle_updated_at();

-- ============================================
-- SEED: Set the owner user (will upsert on first login)
-- ============================================
-- The owner is auto-detected by OWNER_DISCORD_ID env var,
-- but you can also manually set it:
-- insert into public.users (discord_id, discord_username, is_owner)
-- values ('718559807925387337', 'Owner', true)
-- on conflict (discord_id) do update set is_owner = true;
