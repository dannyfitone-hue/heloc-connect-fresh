HELOC CONNECT SUPABASE DIRECT INSERT FIX

This version fixes lead submission by avoiding the Supabase JS client and inserting directly through Supabase REST.

After deployment, open:
https://helocconnect.com/api/debug-env

It should show:
- supabaseUrlLooksCorrect: true
- anonLooksNew: true
- serviceLooksNew: true
- serviceHasSpacesOrLineBreaks: false

Also run supabase/schema.sql in Supabase SQL Editor once.

Then submit a test lead.
