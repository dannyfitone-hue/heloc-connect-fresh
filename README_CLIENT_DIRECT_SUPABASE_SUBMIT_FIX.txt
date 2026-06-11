HELOC CONNECT CLIENT DIRECT SUPABASE SUBMIT FIX

This build bypasses the broken Vercel server-to-Supabase /api/leads request.

The homepage now saves leads directly from the browser to Supabase REST using:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

It inserts only the real live columns:
- tracking_id
- client_token
- first_name
- last_name
- phone
- email
- property_address
- home_value
- credit_score
- monthly_income
- requested_cash
- loan_purpose
- lead_source
- status
- funded_amount

Important:
Because this uses the public publishable key, public.leads must allow insert from anon.
Your RLS currently shows OFF, so it should work.

Deploy:
1. Upload this ZIP to GitHub main.
2. Let Vercel redeploy.
3. Hard refresh homepage.
4. Submit lead.
5. Check Supabase leads table and /owner.
