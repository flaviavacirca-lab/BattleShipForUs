-- schema.sql — Supabase database setup for Battleship Date Night
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- 1. Games table: stores active game sessions
create table if not exists public.games (
  id text primary key,
  state jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Profiles table: persistent question tracking across games
create table if not exists public.profiles (
  player text primary key,
  answered jsonb not null default '[]',
  updated_at timestamptz default now()
);

-- 3. Enable Row Level Security with permissive policies (anonymous access)
alter table public.games enable row level security;
create policy "Allow all access to games"
  on public.games for all
  using (true) with check (true);

alter table public.profiles enable row level security;
create policy "Allow all access to profiles"
  on public.profiles for all
  using (true) with check (true);

-- 4. Enable Realtime on the games table
alter publication supabase_realtime add table public.games;

-- 5. Initialize player profiles
insert into public.profiles (player, answered)
values ('D', '[]'), ('F', '[]')
on conflict (player) do nothing;
