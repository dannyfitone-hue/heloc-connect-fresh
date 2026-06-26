HELOC CONNECT V11 Premium Homepage Merge

What changed:
- Replaced app/page.tsx only with the approved premium dark/3D homepage and smart qualifying calculator.
- Kept admin/owner portal, lender portal, client status page, login pages, and status routes untouched.
- Kept /api/leads, /api/property-value, and /api/address-autocomplete connected.
- Address autocomplete now retrieves Google Place Details so street/city/state/ZIP are sent to ATTOM more accurately.
- Lead submit still posts to /api/leads and redirects to /status/[token].
- Extra lead answers are stored in the existing notes field so no database schema changes are required.

Important:
- Make sure Vercel has GOOGLE_MAPS_SERVER_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
- Make sure Vercel has ATTOM_API_KEY.
- Make sure Vercel has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
- No portal files were redesigned or removed.
