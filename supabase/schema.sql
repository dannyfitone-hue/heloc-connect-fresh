create extension if not exists "uuid-ossp";

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

create table if not exists public.leads (
 id uuid primary key default uuid_generate_v4(),
 token text unique not null,
 created_at timestamptz default now(),
 updated_at timestamptz default now(),
 first_name text,
 last_name text,
 phone text,
 email text,
 address text,
 city text,
 state text,
 zip text,
 home_value numeric default 0,
 mortgage_balance numeric default 0,
 requested_amount numeric default 0,
 equity_room numeric default 0,
 estimated_payment numeric default 0,
 loans_on_property text,
 credit_score text,
 income numeric default 0,
 mortgage_standing text,
 status text default 'Application Received',
 notes text,
 funded_amount numeric default 0,
 assigned_company text,
 assigned_agent text,
 assigned_lender_id uuid references public.lender_users(id) on delete set null,
 document_request text
);

alter table public.leads alter column token type text;
alter table public.leads alter column first_name type text;
alter table public.leads alter column last_name type text;
alter table public.leads alter column phone type text;
alter table public.leads alter column email type text;
alter table public.leads alter column address type text;
alter table public.leads alter column city type text;
alter table public.leads alter column state type text;
alter table public.leads alter column zip type text;
alter table public.leads alter column loans_on_property type text;
alter table public.leads alter column credit_score type text;
alter table public.leads alter column mortgage_standing type text;
alter table public.leads alter column status type text;
alter table public.leads alter column notes type text;

alter table public.leads add column if not exists updated_at timestamptz default now();
alter table public.leads add column if not exists funded_amount numeric default 0;
alter table public.leads add column if not exists assigned_company text;
alter table public.leads add column if not exists assigned_agent text;
alter table public.leads add column if not exists assigned_lender_id uuid references public.lender_users(id) on delete set null;
alter table public.leads add column if not exists document_request text;

alter table public.lender_users add column if not exists updated_at timestamptz default now();
alter table public.lender_users add column if not exists company_name text;
alter table public.lender_users add column if not exists phone text;
alter table public.lender_users add column if not exists is_active boolean default true;

create index if not exists leads_token_idx on public.leads(token);
create index if not exists leads_created_at_idx on public.leads(created_at desc);
create index if not exists leads_assigned_lender_idx on public.leads(assigned_lender_id);
create index if not exists lender_users_email_idx on public.lender_users(email);
