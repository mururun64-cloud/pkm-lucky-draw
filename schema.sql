-- PKM DUN SENTOSA Lucky Draw - Supabase schema
-- Run this once in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password text not null,
  created_at timestamptz not null default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date text,
  venue text,
  organizer text,
  total_draws integer not null default 0,
  background text default '',
  background_type text default '',
  logo text default '',
  status text not null default 'OPEN' check (status in ('OPEN','CLOSED')),
  created_at timestamptz not null default now()
);

create table if not exists prizes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  level text not null,
  name text not null,
  description text default '',
  quantity integer not null default 1,
  draw_order integer not null default 1,
  image text default '',
  created_at timestamptz not null default now()
);

create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  registration_no text not null,
  full_name text not null,
  name_key text not null,
  nric text not null,
  nric_key text not null,
  contact text not null,
  contact_key text not null,
  registered_at timestamptz not null default now(),
  status text not null default 'ELIGIBLE'
);

create unique index if not exists ux_participant_registration on participants(event_id, registration_no);
create unique index if not exists ux_participant_name on participants(event_id, name_key);
create unique index if not exists ux_participant_nric on participants(event_id, nric_key);
create unique index if not exists ux_participant_contact on participants(event_id, contact_key);

create table if not exists draws (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  prize_id uuid not null references prizes(id) on delete cascade,
  participant_id uuid not null references participants(id) on delete cascade,
  sequence integer not null,
  drawn_at timestamptz not null default now(),
  collected_at timestamptz,
  unique(event_id, participant_id)
);

create index if not exists ix_prizes_event_order on prizes(event_id, draw_order);
create index if not exists ix_participants_event on participants(event_id);
create index if not exists ix_draws_event_sequence on draws(event_id, sequence);

-- The first login will create the admin user using ADMIN_USERNAME/ADMIN_PASSWORD from Vercel.
-- Defaults are admin / admin123 only if those environment variables are not set.

insert into storage.buckets (id, name, public)
values ('lucky-draw', 'lucky-draw', true)
on conflict (id) do update set public = true;
