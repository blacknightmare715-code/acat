-- =========================================================================
-- ACAT CyberGuard — Supabase schema + RLS
-- Run this in Supabase Dashboard > SQL Editor (or via `supabase db push`)
-- Mirrors the data shapes already used by the prototype's `api` object,
-- so the frontend rewire (Step 5) is a near 1:1 mapping.
-- =========================================================================

-- ---------- Extensions ----------------------------------------------------
create extension if not exists "uuid-ossp";

-- ---------- Profiles (one row per authenticated user) ---------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  created_at timestamptz not null default now()
);

-- ---------- Staff roles (who can act as an ACAT reviewer) -----------------
-- Add a row here manually (via Dashboard) for each real ACAT team member.
-- Never let end users insert into this table themselves.
create table if not exists staff_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'staff' check (role in ('staff', 'admin')),
  created_at timestamptz not null default now()
);

-- Helper used inside policies below.
create or replace function is_staff()
returns boolean
language sql
security definer
stable
as $$
  select exists (select 1 from staff_roles where user_id = auth.uid());
$$;

-- ---------- Incidents -------------------------------------------------
create table if not exists incidents (
  id uuid primary key default uuid_generate_v4(),
  incident_code text not null unique,          -- e.g. ACAT-2026-K7M9QX
  user_id uuid not null references auth.users(id) on delete cascade,
  type text,                                    -- scam | phishing | account | harassment | fakeprofile | malware | other
  status text not null default 'draft'
    check (status in ('draft','submitted','reviewing','guidance','needs_information','escalated','closed','archived')),
  severity text not null default 'unassessed',
  occurred_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  closed_at timestamptz,
  report jsonb not null default '{}'::jsonb     -- { platform, description, impact, urgency, contact, consent_version }
);

create index if not exists incidents_user_id_idx on incidents(user_id);
create index if not exists incidents_status_idx on incidents(status);

-- ---------- Evidence --------------------------------------------------
create table if not exists evidence (
  id uuid primary key default uuid_generate_v4(),
  incident_id uuid not null references incidents(id) on delete cascade,
  category text not null,                       -- screenshot | message_export | photo_video | document | link_url | note
  note text,
  url text,
  file_name text,
  file_mime text,
  file_size bigint,
  file_sha256 text,
  storage_path text,                            -- path inside the 'evidence' storage bucket
  malware_scan_status text default 'pending'    -- pending | clean | flagged | error (set by the scanning Edge Function)
    check (malware_scan_status in ('pending','clean','flagged','error')),
  added_at timestamptz not null default now()
);

create index if not exists evidence_incident_id_idx on evidence(incident_id);

-- ---------- Timeline events -----------------------------------------------
create table if not exists timeline_events (
  id uuid primary key default uuid_generate_v4(),
  incident_id uuid not null references incidents(id) on delete cascade,
  event_type text not null,   -- incident_started | evidence_added | evidence_hash_generated |
                               -- report_submitted | status_changed | acat_guidance |
                               -- user_message | user_acknowledgement
  category text,              -- for evidence_added / evidence_hash_generated
  from_status text,           -- for status_changed
  to_status text,             -- for status_changed
  message text,                -- for acat_guidance / user_message
  hash text,                   -- for evidence_hash_generated
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists timeline_events_incident_id_idx on timeline_events(incident_id);

-- ---------- Alerts & Guides (public content, staff-managed) ---------------
create table if not exists alerts (
  id uuid primary key default uuid_generate_v4(),
  severity text not null check (severity in ('informational','warning','high','critical')),
  category text,
  title text not null,
  summary text,
  what text,
  who text,
  do_now text,
  avoid text,
  source text,
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists guides (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- Row Level Security
-- =========================================================================
alter table profiles enable row level security;
alter table incidents enable row level security;
alter table evidence enable row level security;
alter table timeline_events enable row level security;
alter table alerts enable row level security;
alter table guides enable row level security;
alter table staff_roles enable row level security;

-- profiles: a user can read/update only their own row
create policy "profiles_select_own" on profiles for select using (id = auth.uid());
create policy "profiles_update_own" on profiles for update using (id = auth.uid());
create policy "profiles_insert_own" on profiles for insert with check (id = auth.uid());

-- staff_roles: nobody can write via the client; manage from the Dashboard
-- only. Select is limited to a user's own row, so the app can ask "am I
-- staff?" without being able to read who else is on the team.
create policy "staff_roles_select_own" on staff_roles for select using (user_id = auth.uid());

-- incidents: owners see/manage their own; staff see and update all
create policy "incidents_select_own_or_staff" on incidents
  for select using (user_id = auth.uid() or is_staff());
create policy "incidents_insert_own" on incidents
  for insert with check (user_id = auth.uid());
create policy "incidents_update_own_or_staff" on incidents
  for update using (user_id = auth.uid() or is_staff());

-- evidence: visible/manageable if you own the parent incident, or you're staff
create policy "evidence_select_via_incident" on evidence
  for select using (
    exists (select 1 from incidents i where i.id = incident_id and (i.user_id = auth.uid() or is_staff()))
  );
create policy "evidence_insert_via_incident" on evidence
  for insert with check (
    exists (select 1 from incidents i where i.id = incident_id and (i.user_id = auth.uid() or is_staff()))
  );

-- timeline_events: readable by the incident's owner or staff.
-- Inserts of staff-only event types (status_changed, acat_guidance) should go
-- through a server-side function/Edge Function that checks is_staff() itself,
-- rather than relying on this policy alone — a determined client could
-- otherwise insert a fake "acat_guidance" row for their own incident.
create policy "timeline_select_via_incident" on timeline_events
  for select using (
    exists (select 1 from incidents i where i.id = incident_id and (i.user_id = auth.uid() or is_staff()))
  );
create policy "timeline_insert_user_events" on timeline_events
  for insert with check (
    event_type in ('incident_started','evidence_added','evidence_hash_generated','report_submitted','user_message','user_acknowledgement')
    and exists (select 1 from incidents i where i.id = incident_id and i.user_id = auth.uid())
  );
create policy "timeline_insert_staff_events" on timeline_events
  for insert with check (
    event_type in ('status_changed','acat_guidance') and is_staff()
  );

-- alerts & guides: public read, staff-only write
create policy "alerts_public_read" on alerts for select using (true);
create policy "alerts_staff_write" on alerts for insert with check (is_staff());
create policy "alerts_staff_update" on alerts for update using (is_staff());

create policy "guides_public_read" on guides for select using (true);
create policy "guides_staff_write" on guides for insert with check (is_staff());
create policy "guides_staff_update" on guides for update using (is_staff());

-- =========================================================================
-- Storage bucket (run separately, or create 'evidence' bucket via Dashboard
-- as PRIVATE, then apply these policies under Storage > Policies)
-- =========================================================================
-- insert into storage.buckets (id, name, public) values ('evidence', 'evidence', false);
--
-- create policy "evidence_bucket_owner_rw" on storage.objects
--   for all using (bucket_id = 'evidence' and (auth.uid())::text = (storage.foldername(name))[1]);
--   -- convention: store files at  evidence/{user_id}/{incident_id}/{evidence_id}-{filename}
--
-- create policy "evidence_bucket_staff_read" on storage.objects
--   for select using (bucket_id = 'evidence' and is_staff());
