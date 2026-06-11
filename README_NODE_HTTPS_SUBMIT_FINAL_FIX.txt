HELOC CONNECT NODE HTTPS SUBMIT FINAL FIX

This build stops using:
- browser direct Supabase submit
- Supabase JS client in /api/leads
- Node fetch/undici in /api/leads

Instead /api/leads submits to Supabase REST using Node's native https.request.

This is designed specifically to bypass the repeating "fetch failed" issue.

Deploy:
1. Upload ZIP to GitHub main.
2. Let Vercel redeploy.
3. Hard refresh browser.
4. Open: https://helocconnect.com/api/debug-https-supabase
5. If ok true, submit test lead.
