HELOC CONNECT LIVE SITE PORTALS + DATABASE FIX

Fixed:
- Removed public Owner/Lender links from homepage nav.
- Added secure /owner-login and /lender-login pages.
- Protected /owner and /lender with password cookies.
- Lead form now shows exact Supabase error instead of silently redirecting.
- /api/leads saves to Supabase without Twilio dependency.
- Updated SQL schema included.

IMPORTANT:
Run supabase/schema.sql in Supabase SQL Editor once.
Then redeploy.

Required Vercel env variables:
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OWNER_DASHBOARD_PASSWORD
LENDER_DASHBOARD_PASSWORD
GOOGLE_MAPS_SERVER_API_KEY
ATTOM_API_KEY
