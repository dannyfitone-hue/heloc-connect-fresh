create extension if not exists "uuid-ossp";
create table if not exists leads (
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
 missed_payments text,
 goal text,
 status text default 'Application Received',
 notes text
);
create table if not exists document_requests (
 id uuid primary key default uuid_generate_v4(),
 lead_id uuid references leads(id) on delete cascade,
 created_at timestamptz default now(),
 document_type text not null,
 note text,
 status text default 'Requested',
 file_path text,
 uploaded_at timestamptz
);
