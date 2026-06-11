HELOC CONNECT LEGACY SERVICE ROLE COMPATIBILITY FIX

This build allows the lead API to work with either:
1. New Supabase secret key: sb_secret_...
2. Legacy service_role JWT key: eyJ...

IMPORTANT IF FETCH FAILED CONTINUES:
Go to Supabase > API Keys > Legacy anon, service_role API keys.
Copy the LEGACY service_role key that starts with eyJ...
Paste it into Vercel as:
SUPABASE_SERVICE_ROLE_KEY

Then redeploy.

Test:
https://helocconnect.com/api/debug-supabase-insert-test

Expected:
ok: true
