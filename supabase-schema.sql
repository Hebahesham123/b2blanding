-- Run this in Supabase SQL Editor to create the submissions table

create table if not exists public.submissions (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  phone_number text not null,
  promo_code text not null,
  created_at timestamptz default now()
);

-- Optional: enable RLS and allow anonymous insert + service role read
alter table public.submissions enable row level security;

-- Allow anyone to insert (for the landing form)
create policy "Allow anonymous insert"
  on public.submissions for insert
  with check (true);

-- Allow read only with service key or add a policy for admin (e.g. via API with secret)
-- For dashboard we'll use the anon key; you can restrict with a separate "admin" table or auth.
create policy "Allow read for authenticated or service"
  on public.submissions for select
  using (true);
