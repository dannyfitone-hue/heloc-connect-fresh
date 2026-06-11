HELOC CONNECT PREMIUM WORKING FINAL

Includes:
- Premium homepage with corrected margins
- Hero image included at /public/heloc-office-premium.png
- Smart calculator with address autocomplete flow
- Google Places API backend: /api/address-autocomplete
- ATTOM value lookup backend: /api/property-value
- Lead submission API and status redirect
- Owner portal: /owner
- Lender portal: /lender
- Client status portal: /status/[token]
- Twilio SMS route
- Supabase schema
- Clean Vercel npm config

For auto address + value:
Add these Vercel environment variables:
GOOGLE_MAPS_SERVER_API_KEY
ATTOM_API_KEY

Without those keys, autocomplete shows demo suggestions and value lookup shows a message.
