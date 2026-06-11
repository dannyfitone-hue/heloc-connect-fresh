HELOC CONNECT EXISTING SUPABASE TABLE COMPATIBILITY FIX

Your live Supabase leads table uses:
- client_token
- property_address
- tracking_id

This fix updates the lead submit route to save using those existing columns.

Deploy steps:
1. Upload this ZIP to GitHub and redeploy on Vercel.
2. In Supabase SQL Editor, run:
   supabase/live_table_compat_patch.sql
3. Submit a test lead.
4. It should redirect to /status/{client_token}.
5. Admin should show the lead.

This avoids deleting or rebuilding your existing Supabase table.
