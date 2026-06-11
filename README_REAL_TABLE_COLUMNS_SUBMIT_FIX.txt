HELOC CONNECT REAL TABLE COLUMNS SUBMIT FIX

Your live Supabase leads table uses requested_cash, not requested_amount.
This build fixes /api/leads to insert using the actual live table columns visible in Supabase.

Key fix:
- requested_amount removed
- requested_cash used
- risky missing columns removed from insert payload

Deploy:
1. Upload this ZIP to GitHub.
2. Commit to main.
3. Let Vercel redeploy.
4. Test:
   https://helocconnect.com/api/debug-supabase-insert-test
5. Submit a lead.
