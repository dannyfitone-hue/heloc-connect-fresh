HELOC CONNECT LENDER PORTAL UPGRADE

New admin features included:
- Owner dashboard tabs: Lead Control, Network Users, Funding Reports
- Create mortgage-company profiles
- Create lender/agent logins with email + password
- Assign each lead to a mortgage company and optional agent
- Lender login page: /lender-login
- Lender dashboard page: /lender
- Lenders only see leads assigned to their company; agents only see leads assigned to them
- Lenders can update lead status, add notes, and mark funded amounts
- Owner can see total funded volume and reports by mortgage company

Existing routes:
- Owner login: /owner-login
- Owner dashboard: /owner
- Lender login: /lender-login
- Lender dashboard: /lender

Required Vercel environment variables already used by the project:
- NEXT_PUBLIC_SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- OWNER_DASHBOARD_PASSWORD
- NEXT_PUBLIC_SITE_URL
- GOOGLE_MAPS_SERVER_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
- ATTOM_API_KEY
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_FROM_NUMBER

IMPORTANT SUPABASE STEP:
Run the updated SQL in supabase/schema.sql in your Supabase SQL editor before using the lender portal.
It adds mortgage_companies, lender_users, assigned_company_id, assigned_user_id, assigned_at, and funded_at.
