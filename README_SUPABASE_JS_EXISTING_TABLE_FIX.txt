HELOC CONNECT SUPABASE JS EXISTING TABLE FIX

This version switches /api/leads back to Supabase JS, but now uses your REAL live table columns:
- client_token
- property_address
- tracking_id

After deployment, test:
https://helocconnect.com/api/debug-supabase-insert-test

It should return ok: true.

Then submit a test lead.
