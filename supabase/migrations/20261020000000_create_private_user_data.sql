create table if not exists public.punches (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('clock_in', 'break_start', 'break_end', 'clock_out')),
  at timestamptz not null,
  manual boolean not null default false,
  photo_path text,
  created_at timestamptz not null default now(),
  constraint punches_user_id_id_unique unique (user_id, id)
);

create index if not exists punches_user_at_idx on public.punches (user_id, at);

alter table public.punches enable row level security;

grant select, insert, update, delete on public.punches to authenticated;

create policy "Users manage their own punches"
  on public.punches
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  target_minutes integer not null default 480 check (target_minutes between 60 and 960),
  name text not null default '' check (char_length(name) <= 40),
  adjustments jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

grant select, insert, update, delete on public.user_settings to authenticated;

create policy "Users manage their own settings"
  on public.user_settings
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit)
values ('receipts', 'receipts', false, 20971520)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit;

create policy "Users read their own receipt photos"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Users upload their own receipt photos"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Users update their own receipt photos"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Users delete their own receipt photos"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
