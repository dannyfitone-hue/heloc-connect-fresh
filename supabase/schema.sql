create extension if not exists "pgcrypto";

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  tracking_id text unique not null,
  client_token text unique not null,
  first_name text,
  last_name text,
  phone text,
  email text,
  property_address text,
  home_value numeric default 0,
  credit_score text,
  monthly_income numeric default 0,
  requested_cash numeric default 0,
  loan_purpose text,
  lead_source text,
  status text default 'Application Received',
  funded_amount numeric default 0,
  assigned_lender text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists lead_documents (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  document_type text not null,
  note text,
  status text default 'Requested',
  file_path text,
  file_name text,
  created_at timestamptz default now(),
  uploaded_at timestamptz
);

create table if not exists lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  note text not null,
  created_at timestamptz default now()
);

alter table leads enable row level security;
alter table lead_documents enable row level security;
alter table lead_notes enable row level security;
-- API routes use service role key server-side for MVP.
-- Create Supabase Storage bucket: client-documents

-- Lender portal upgrade: mortgage-company network, lender/agent logins, assignment, and funded reporting.
create table if not exists mortgage_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  contact_email text,
  phone text,
  notes text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists lender_users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references mortgage_companies(id) on delete cascade,
  name text not null,
  email text unique not null,
  role text default 'lender',
  password_hash text not null,
  password_salt text not null,
  session_token text,
  is_active boolean default true,
  last_login_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table leads add column if not exists assigned_company_id uuid references mortgage_companies(id);
alter table leads add column if not exists assigned_user_id uuid references lender_users(id);
alter table leads add column if not exists assigned_at timestamptz;
alter table leads add column if not exists funded_at timestamptz;

alter table mortgage_companies enable row level security;
alter table lender_users enable row level security;
