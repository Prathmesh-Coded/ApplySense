-- applications
create table applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company text not null,
  role text not null,
  status text not null default 'applied'
    check (status in ('applied','screening','interview','offer','onboarding','active','rejected')),
  source text not null default 'manual'
    check (source in ('manual','gmail-sync')),
  applied_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- timeline_events
create table timeline_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  event_type text not null,
  description text not null,
  raw_snippet text check (char_length(raw_snippet) <= 500),
  sender_domain text,
  confidence real,
  confirmed boolean not null default false,
  event_date timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- sync_state (one row per user)
create table sync_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_history_id text,
  last_synced_at timestamptz,
  sync_window_days int not null default 90
);

-- processed_messages (dedup / idempotency)
create table processed_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  gmail_message_id text not null,
  processed_at timestamptz not null default now(),
  unique (user_id, gmail_message_id)
);

-- indexes for common lookups
create index idx_applications_user_id on applications(user_id);
create index idx_timeline_events_application_id on timeline_events(application_id);
create index idx_processed_messages_user_id on processed_messages(user_id);

-- updated_at auto-update trigger for applications
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_applications_updated_at
before update on applications
for each row execute function set_updated_at();

-- Row Level Security
alter table applications enable row level security;
alter table timeline_events enable row level security;
alter table sync_state enable row level security;
alter table processed_messages enable row level security;

create policy "Users manage own applications"
  on applications for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own timeline events"
  on timeline_events for all
  using (
    auth.uid() = (select user_id from applications where applications.id = timeline_events.application_id)
  )
  with check (
    auth.uid() = (select user_id from applications where applications.id = timeline_events.application_id)
  );

create policy "Users manage own sync state"
  on sync_state for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own processed messages"
  on processed_messages for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);