-- ============================================================
-- ev.fin LOS/LMS — Supabase Schema
-- Run this in the SQL editor of your Supabase project
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  name         text not null,
  phone        text,
  role         text not null check (role in ('fso', 'credit_analyst', 'rcm', 'disbursement', 'admin')),
  region       text default 'west',
  active       boolean default true,
  created_at   timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins can read all profiles"
  on public.profiles for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile after signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), coalesce(new.raw_user_meta_data->>'role', 'fso'));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- DEALERS
-- ============================================================
create table if not exists public.dealers (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  city         text not null,
  state        text not null,
  pincode      text,
  oems         text[] default '{}',
  bank_account text,
  ifsc         text,
  active       boolean default true,
  created_at   timestamptz default now()
);

alter table public.dealers enable row level security;

create policy "Authenticated users can read dealers"
  on public.dealers for select
  using (auth.uid() is not null);

-- ============================================================
-- APPLICATIONS
-- ============================================================
create table if not exists public.applications (
  id              uuid primary key default gen_random_uuid(),
  app_number      text unique not null,
  fso_id          uuid references public.profiles(id),
  dealer_id       uuid references public.dealers(id),
  status          text not null default 'submitted'
                  check (status in ('submitted','under_review','query_raised','referred_to_rcm','approved','sanctioned','disbursed','rejected','cancelled')),

  -- Applicant
  customer_name   text not null,
  customer_phone  text not null,
  city            text,
  state           text,
  pincode         text,

  -- Vehicle
  oem             text,
  model           text,
  vehicle_price   numeric(12,2),

  -- Loan
  loan_amount     numeric(12,2) not null,
  down_payment    numeric(12,2),
  tenure_months   integer,
  emi             numeric(10,2),

  -- KYC
  aadhaar_ref     text,
  pan_number      text,

  -- Timestamps
  submitted_at    timestamptz default now(),
  updated_at      timestamptz default now(),

  -- Arbitrary metadata (CIBIL, etc.)
  meta            jsonb default '{}'::jsonb
);

alter table public.applications enable row level security;

create policy "FSO can read own applications"
  on public.applications for select
  using (fso_id = auth.uid());

create policy "Credit ops can read all applications"
  on public.applications for select
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and p.role in ('credit_analyst', 'rcm', 'disbursement', 'admin')
  ));

create policy "FSO can insert applications"
  on public.applications for insert
  with check (fso_id = auth.uid());

create policy "Credit ops can update applications"
  on public.applications for update
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and p.role in ('credit_analyst', 'rcm', 'disbursement', 'admin')
  ));

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger applications_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();

-- ============================================================
-- DOCUMENTS
-- ============================================================
create table if not exists public.documents (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid references public.applications(id) on delete cascade,
  doc_type        text not null,
  file_url        text,
  file_name       text,
  uploaded_by     uuid references public.profiles(id),
  uploaded_at     timestamptz default now(),
  status          text default 'uploaded' check (status in ('uploaded','verified','rejected')),
  unique (application_id, doc_type)
);

alter table public.documents enable row level security;

create policy "Users can read docs for their applications"
  on public.documents for select
  using (
    exists (
      select 1 from public.applications a
      where a.id = application_id
      and (a.fso_id = auth.uid() or exists (
        select 1 from public.profiles p
        where p.id = auth.uid()
        and p.role in ('credit_analyst', 'rcm', 'disbursement', 'admin')
      ))
    )
  );

create policy "Users can upload docs"
  on public.documents for insert
  with check (uploaded_by = auth.uid());

create policy "Users can update own docs"
  on public.documents for update
  using (uploaded_by = auth.uid());

-- ============================================================
-- CREDIT DECISIONS
-- ============================================================
create table if not exists public.credit_decisions (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid references public.applications(id) on delete cascade,
  analyst_id      uuid references public.profiles(id),
  decision        text not null check (decision in ('approve','reject','query','refer_to_rcm','sanction')),
  remarks         text,
  decided_at      timestamptz default now()
);

alter table public.credit_decisions enable row level security;

create policy "Credit ops can manage decisions"
  on public.credit_decisions for all
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and p.role in ('credit_analyst', 'rcm', 'disbursement', 'admin')
  ));

create policy "FSO can read decisions on own apps"
  on public.credit_decisions for select
  using (exists (
    select 1 from public.applications a
    where a.id = application_id and a.fso_id = auth.uid()
  ));

-- ============================================================
-- QUERIES (query_raised details)
-- ============================================================
create table if not exists public.queries (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid references public.applications(id) on delete cascade,
  raised_by       uuid references public.profiles(id),
  message         text not null,
  resolved        boolean default false,
  created_at      timestamptz default now()
);

alter table public.queries enable row level security;

create policy "Users involved can access queries"
  on public.queries for all
  using (
    raised_by = auth.uid() or
    exists (
      select 1 from public.applications a
      where a.id = application_id and a.fso_id = auth.uid()
    ) or
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.role in ('credit_analyst', 'rcm', 'disbursement', 'admin')
    )
  );

-- ============================================================
-- DISBURSEMENTS
-- ============================================================
create table if not exists public.disbursements (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid references public.applications(id) on delete cascade,
  amount          numeric(12,2) not null,
  txn_ref         text unique,
  initiated_by    uuid references public.profiles(id),
  initiated_at    timestamptz default now(),
  status          text default 'completed' check (status in ('pending','processing','completed','failed'))
);

alter table public.disbursements enable row level security;

create policy "Disbursement team can manage disbursements"
  on public.disbursements for all
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and p.role in ('disbursement', 'admin')
  ));

create policy "Credit ops can read disbursements"
  on public.disbursements for select
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and p.role in ('credit_analyst', 'rcm', 'disbursement', 'admin')
  ));

-- ============================================================
-- ACTIVITY LOG
-- ============================================================
create table if not exists public.activity_log (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid references public.applications(id) on delete cascade,
  actor_id        uuid references public.profiles(id),
  action          text not null,
  meta            jsonb default '{}'::jsonb,
  created_at      timestamptz default now()
);

alter table public.activity_log enable row level security;

create policy "Users can read activity for own apps"
  on public.activity_log for select
  using (
    actor_id = auth.uid() or
    exists (
      select 1 from public.applications a
      where a.id = application_id and a.fso_id = auth.uid()
    ) or
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.role in ('credit_analyst', 'rcm', 'disbursement', 'admin')
    )
  );

create policy "Authenticated users can insert activity"
  on public.activity_log for insert
  with check (actor_id = auth.uid());

-- ============================================================
-- STORAGE BUCKET
-- ============================================================
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict do nothing;

create policy "Authenticated users can upload documents"
  on storage.objects for insert
  with check (bucket_id = 'documents' and auth.uid() is not null);

create policy "Documents are publicly readable"
  on storage.objects for select
  using (bucket_id = 'documents');

-- ============================================================
-- SEED DATA — Demo dealers
-- ============================================================
insert into public.dealers (name, city, state, pincode, oems, bank_account, ifsc) values
  ('Ather Experience Centre', 'Mumbai', 'Maharashtra', '400051', '{"ather"}', '1234567890', 'HDFC0001234'),
  ('Ola Electric Hub', 'Pune', 'Maharashtra', '411001', '{"ola"}', '9876543210', 'ICIC0004321'),
  ('Bajaj EV World', 'Hyderabad', 'Telangana', '500034', '{"bajaj","ampere"}', '1122334455', 'SBIN0012345'),
  ('River Motors', 'Visakhapatnam', 'Andhra Pradesh', '530001', '{"river"}', '5566778899', 'AXIS0009876'),
  ('Ampere Showroom', 'Nagpur', 'Maharashtra', '440001', '{"ampere"}', '6677889900', 'KOTAK0011111'),
  ('Simple Energy', 'Bhubaneswar', 'Odisha', '751001', '{"simple"}', '7788990011', 'HDFC0005678')
on conflict do nothing;

-- ============================================================
-- SEED DATA — Demo users (run AFTER creating auth users via Supabase dashboard)
-- Replace UUIDs below with the actual auth.users IDs from your project
-- ============================================================
-- Example (update with real UUIDs from auth.users after creating them in Auth > Users):
--
-- insert into public.profiles (id, name, phone, role) values
--   ('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 'Aman Verma (FSO)', '+91-9001234567', 'fso'),
--   ('yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy', 'Sneha Iyer (Analyst)', '+91-9009876543', 'credit_analyst'),
--   ('zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz', 'Rajesh Kumar (RCM)', '+91-9001111222', 'rcm')
-- on conflict do nothing;
