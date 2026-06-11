-- Run this if your existing leads table already has client_token/property_address/tracking_id.
-- It keeps your old data and adds missing fields needed by the new admin/lender system.

alter table public.leads add column if not exists city text;
alter table public.leads add column if not exists state text;
alter table public.leads add column if not exists zip text;
alter table public.leads add column if not exists home_value numeric default 0;
alter table public.leads add column if not exists mortgage_balance numeric default 0;
alter table public.leads add column if not exists requested_amount numeric default 0;
alter table public.leads add column if not exists equity_room numeric default 0;
alter table public.leads add column if not exists estimated_payment numeric default 0;
alter table public.leads add column if not exists loans_on_property text;
alter table public.leads add column if not exists credit_score text;
alter table public.leads add column if not exists monthly_income numeric default 0;
alter table public.leads add column if not exists mortgage_standing text;
alter table public.leads add column if not exists status text default 'Application Received';
alter table public.leads add column if not exists notes text;
alter table public.leads add column if not exists funded_amount numeric default 0;
alter table public.leads add column if not exists assigned_company text;
alter table public.leads add column if not exists assigned_agent text;
alter table public.leads add column if not exists assigned_lender_id uuid;
alter table public.leads add column if not exists document_request text;
alter table public.leads add column if not exists updated_at timestamptz default now();

create table if not exists public.lender_users (
 id uuid primary key default uuid_generate_v4(),
 created_at timestamptz default now(),
 updated_at timestamptz default now(),
 lender_name text not null,
 company_name text,
 email text unique not null,
 phone text,
 password text not null,
 is_active boolean default true
);

create index if not exists leads_client_token_idx on public.leads(client_token);
create index if not exists leads_created_at_idx on public.leads(created_at desc);
create index if not exists leads_assigned_lender_idx on public.leads(assigned_lender_id);
create index if not exists lender_users_email_idx on public.lender_users(email);
