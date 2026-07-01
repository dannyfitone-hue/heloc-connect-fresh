-- Optional SMS visibility table for HELOC CONNECT Owner Dashboard.
-- Run this in Supabase SQL Editor when ready. The app also falls back to lead_notes if this table does not exist.
create table if not exists public.sms_logs (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  lead_id uuid null references public.leads(id) on delete cascade,
  to_phone text,
  message_body text,
  message_type text,
  delivery_status text default 'sent',
  provider_message_id text,
  triggered_by text,
  provider_response jsonb
);

create index if not exists sms_logs_lead_id_idx on public.sms_logs(lead_id);
create index if not exists sms_logs_created_at_idx on public.sms_logs(created_at desc);
