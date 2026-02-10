-- ============================================================
-- 010: Face Verification Table
-- ============================================================

create table if not exists public.faceverification (
  user_id uuid primary key references public.user_profiles(id) on delete cascade,
  front_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.faceverification is 'Stores front face verification image per user.';
comment on column public.faceverification.front_url is 'Public URL to front face image.';

-- Enable RLS
alter table public.faceverification enable row level security;

-- Users can insert/update their own face verification row
create policy "Users can upsert own face verification"
  on public.faceverification
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own face verification"
  on public.faceverification
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can view their own face verification row
create policy "Users can view own face verification"
  on public.faceverification
  for select
  using (auth.uid() = user_id);

-- Admins can view all face verification rows
create policy "Admins can view all face verification"
  on public.faceverification
  for select
  using (
    exists (
      select 1 from public.admin_users
      where admin_users.id = auth.uid()
      and admin_users.enabled = true
    )
  );

-- updated_at trigger
create trigger set_updated_at_faceverification
  before update on public.faceverification
  for each row execute function public.handle_updated_at();
