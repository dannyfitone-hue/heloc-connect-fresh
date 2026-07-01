HELOC CONNECT — Telnyx SMS Automation

Added:
- Telnyx SMS sender using TELNYX_API_KEY, TELNYX_PHONE_NUMBER, TELNYX_MESSAGING_PROFILE_ID.
- Automatic welcome SMS after form submission.
- Automatic status update SMS from owner and lender updates.
- Automatic documents requested SMS.
- Automatic company matched SMS.
- Owner Dashboard SMS Automation editor.

Required Vercel variables:
TELNYX_API_KEY=<private secret key>
TELNYX_PHONE_NUMBER=+19497032356
TELNYX_MESSAGING_PROFILE_ID=40019f1e-001b-49b6-9e2c-9d5055b5bc68
NEXT_PUBLIC_APP_URL=https://helocconnect.com

Optional Supabase table for editable SMS templates:

create table if not exists public.sms_templates (
  template_key text primary key,
  message text not null,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.sms_templates enable row level security;

-- If using service role only from backend, no public policies are required.

If this table is not created, the app still sends automatic SMS using built-in default templates.
